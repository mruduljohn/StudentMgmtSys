import fs from 'fs';
import { parse } from 'csv-parse';
import * as XLSX from 'xlsx';
import path from 'path';

// Function to check if a file is Excel or CSV
export const getFileType = (filePath: string): 'excel' | 'csv' => {
  const extension = path.extname(filePath).toLowerCase();
  
  if (extension === '.xlsx' || extension === '.xls') {
    return 'excel';
  } else {
    return 'csv';
  }
};

// Parse Excel file (XLSX or XLS)
export const parseExcelFile = async (filePath: string): Promise<any[]> => {
  try {
    // Read file
    const fileBuffer = fs.readFileSync(filePath);
    
    // Parse Excel data
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    
    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const records = XLSX.utils.sheet_to_json(worksheet, { raw: false });
    
    return records;
  } catch (error: unknown) {
    console.error('Error parsing Excel file:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse Excel file: ${errorMessage}`);
  }
};

// Parse CSV file
export const parseCsvFile = async (filePath: string): Promise<any[]> => {
  try {
    const records: any[] = [];
    
    // Create read stream and parser
    const parser = fs
      .createReadStream(filePath)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      }));
    
    // Process each record
    for await (const record of parser) {
      records.push(record);
    }
    
    return records;
  } catch (error: unknown) {
    console.error('Error parsing CSV file:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse CSV file: ${errorMessage}`);
  }
};

// Generic function to parse any supported file format
export const parseFile = async (filePath: string): Promise<any[]> => {
  const fileType = getFileType(filePath);
  
  if (fileType === 'excel') {
    return parseExcelFile(filePath);
  } else {
    return parseCsvFile(filePath);
  }
};

export default {
  getFileType,
  parseExcelFile,
  parseCsvFile,
  parseFile
}; 