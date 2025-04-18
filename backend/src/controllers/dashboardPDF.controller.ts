import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Config from "../models/config.model";
import fs from "fs";
import path from "path";
import ApiError from "../utils/apiError";

// Directory where PDF files will be stored
const PDF_UPLOAD_DIR = path.join(__dirname, "../../uploads/pdfs");

// Ensure the upload directory exists
if (!fs.existsSync(PDF_UPLOAD_DIR)) {
  fs.mkdirSync(PDF_UPLOAD_DIR, { recursive: true });
}

// Get dashboard PDFs
export const getDashboardPDFs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    // Log the request
    console.log("Getting dashboard PDFs");
    
    const config = await Config.findOne({ category: "dashboard-pdfs" }).lean();
    
    // Log what we found
    console.log("Found config:", config);
    
    if (!config) {
      console.log("No config found, creating new one");
      // Initialize with empty array if not found
      const newConfig = await Config.create({ 
        category: "dashboard-pdfs",
        values: [],
        dashboardPDFs: []
      });
      console.log("Created new config:", newConfig);
      res.status(200).json({ dashboardPDFs: [] });
      return;
    }
    
    // If dashboardPDFs doesn't exist or is not an array, return empty array
    const pdfs = Array.isArray(config.dashboardPDFs) ? config.dashboardPDFs : [];
    console.log("Returning PDFs:", pdfs);
    
    res.status(200).json({ dashboardPDFs: pdfs });
  } catch (error) {
    console.error("Error fetching dashboard PDFs:", error);
    res.status(500).json({ message: "Failed to fetch dashboard PDFs" });
  }
});

// Update dashboard PDFs
export const updateDashboardPDFs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.user as { role: string };
    
    if (role !== "ADMIN") {
      res.status(403).json({ message: "Only admins can update dashboard PDFs" });
      return;
    }
    
    const files = req.files as Express.Multer.File[];
    const { titles, descriptions, existingFiles } = req.body;
    
    // Parse JSON strings from form data
    const parsedTitles = JSON.parse(titles);
    const parsedDescriptions = JSON.parse(descriptions);
    const parsedExistingFiles = JSON.parse(existingFiles);
    
    if (!Array.isArray(parsedTitles)) {
      res.status(400).json({ message: "Titles must be an array" });
      return;
    }
    
    // Create an array to hold all PDF entries
    const formattedPdfs = [];
    
    // For each title, check if there's a new file or an existing file to use
    for (let i = 0; i < parsedTitles.length; i++) {
      const title = parsedTitles[i];
      const description = parsedDescriptions[i] || '';
      const existingFilePath = parsedExistingFiles[i];
      
      // Skip entries without a title
      if (!title) continue;
      
      // If there's an existing file path and no new file for this position, use the existing file
      if (existingFilePath) {
        formattedPdfs.push({
          title,
          filePath: existingFilePath,
          description,
          uploadedAt: new Date()
        });
        continue;
      }
      
      // Check if there's a new file for this position
      const fileForThisPosition = files.find((_, index) => {
        return req.body.fileIndices && req.body.fileIndices[index] === i.toString();
      });
      
      if (fileForThisPosition) {
        // Save the file to the uploads directory
        const timestamp = Date.now();
        const filename = `${timestamp}_${fileForThisPosition.originalname.replace(/\s+/g, '_')}`;
        const filePath = path.join(PDF_UPLOAD_DIR, filename);
        
        // Write file to disk
        fs.writeFileSync(filePath, fileForThisPosition.buffer);
        
        formattedPdfs.push({
          title,
          filePath: `/uploads/pdfs/${filename}`,
          description,
          uploadedAt: new Date()
        });
      }
    }
    
    // Use direct MongoDB update with $set operation
    const updateResult = await Config.updateOne(
      { category: "dashboard-pdfs" },
      { 
        $set: { 
          dashboardPDFs: formattedPdfs,
          lastUpdatedBy: req.user ? new mongoose.Types.ObjectId(req.user.id) : undefined
        }
      },
      { upsert: true }
    );
    
    console.log("MongoDB update result:", updateResult);
    
    res.status(200).json({
      success: true,
      message: "Dashboard PDFs updated successfully",
      dashboardPDFs: formattedPdfs
    });
  } catch (error) {
    console.error("Error updating dashboard PDFs:", error);
    res.status(500).json({ 
      message: "Failed to update dashboard PDFs",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Serve a PDF file
export const servePDF = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename } = req.params;
    
    // Sanitize filename to prevent directory traversal
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(PDF_UPLOAD_DIR, sanitizedFilename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: "PDF file not found" });
      return;
    }
    
    // Set headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${sanitizedFilename}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error serving PDF:", error);
    res.status(500).json({ message: "Failed to serve PDF file" });
  }
});

// Delete a dashboard PDF
export const deleteDashboardPDF = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.user as { role: string };
    
    if (role !== "ADMIN") {
      res.status(403).json({ message: "Only admins can delete dashboard PDFs" });
      return;
    }
    
    const { filePath } = req.params;
    
    console.log("Delete PDF request for path:", filePath);
    
    if (!filePath) {
      res.status(400).json({ message: "File path is required" });
      return;
    }
    
    // Get the current config
    const config = await Config.findOne({ category: "dashboard-pdfs" });
    
    if (!config || !config.dashboardPDFs || !Array.isArray(config.dashboardPDFs)) {
      res.status(404).json({ message: "No dashboard PDFs found" });
      return;
    }
    
    console.log("Current dashboardPDFs:", JSON.stringify(config.dashboardPDFs));
    
    // Try different path formats to find the PDF
    let pdfIndex = -1;
    
    // Try exact match
    pdfIndex = config.dashboardPDFs.findIndex(pdf => pdf.filePath === filePath);
    
    // Try with uploads/pdfs prefix
    if (pdfIndex === -1) {
      const pathWithPrefix = `/uploads/pdfs/${path.basename(filePath)}`;
      pdfIndex = config.dashboardPDFs.findIndex(pdf => pdf.filePath === pathWithPrefix);
    }
    
    // Try with leading slash if not already present
    if (pdfIndex === -1) {
      const pathWithSlash = filePath.startsWith('/') ? filePath : `/${filePath}`;
      pdfIndex = config.dashboardPDFs.findIndex(pdf => pdf.filePath === pathWithSlash);
    }
    
    // Try matching by filename only as last resort
    if (pdfIndex === -1) {
      const filename = path.basename(filePath);
      pdfIndex = config.dashboardPDFs.findIndex(pdf => path.basename(pdf.filePath) === filename);
    }
    
    console.log("Found PDF index:", pdfIndex);
    
    if (pdfIndex === -1) {
      res.status(404).json({ message: "PDF not found" });
      return;
    }
    
    const pdfToDelete = config.dashboardPDFs[pdfIndex];
    console.log("PDF to delete:", pdfToDelete);
    
    // Extract the filename from the filePath
    const filename = path.basename(pdfToDelete.filePath);
    const fileOnDisk = path.join(PDF_UPLOAD_DIR, filename);
    
    console.log("Looking for file on disk:", fileOnDisk);
    
    // Delete the file from the filesystem if it exists
    if (fs.existsSync(fileOnDisk)) {
      fs.unlinkSync(fileOnDisk);
      console.log("File deleted from disk");
    } else {
      console.log("File not found on disk, skipping file deletion");
    }
    
    // Remove the PDF from the array
    config.dashboardPDFs.splice(pdfIndex, 1);
    
    // Save the updated config
    config.lastUpdatedBy = req.user ? new mongoose.Types.ObjectId(req.user.id) : undefined;
    await config.save();
    
    console.log("Config saved with updated PDF list");
    
    res.status(200).json({
      success: true,
      message: "Dashboard PDF deleted successfully",
      dashboardPDFs: config.dashboardPDFs
    });
  } catch (error) {
    console.error("Error deleting dashboard PDF:", error);
    res.status(500).json({ 
      message: "Failed to delete dashboard PDF",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}); 