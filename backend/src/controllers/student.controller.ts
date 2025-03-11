import { Request, Response } from "express";
import Student from "../models/student.model";
import User from "../models/user.model";
import Audit from "../models/audit.model";
import fs from "fs";
import { parse } from "csv-parse";
import { Multer } from "multer";

// Define interface for Request with file
interface RequestWithFile extends Request {
  file?: Express.Multer.File;
}

// Get all students with pagination and filtering
export const getAllStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Request query params:", req.query);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object from query params
    const filter: any = {};
    
    // Handle search query
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      filter.$or = [
        { name: searchRegex },
        { studentId: searchRegex },
        { phoneNumber: searchRegex },
        { email: searchRegex },
        { address: searchRegex }
      ];
    }
    
    // Handle specific filters
    const filterFields = [
      'gender', 'batch', 'classTeacher', 'hostel', 'stream', 
      'program', 'studyMaterial', 'uniform', 'idCard', 'tab', 
      'joined', 'syllabus'
    ];
    
    filterFields.forEach(field => {
      if (req.query[field]) {
        // Handle boolean string conversions
        if (req.query[field] === 'true') {
          filter[field] = true;
        } else if (req.query[field] === 'false') {
          filter[field] = false;
        } else if (field === 'joined' && req.query[field] === 'JOINED') {
          filter[field] = 'JOINED';
        } else if (field === 'joined' && req.query[field] === 'NOT_JOINED') {
          filter[field] = { $ne: 'JOINED' };
        } else {
          filter[field] = req.query[field];
        }
      }
    });
    
    // Handle numeric range filters
    if (req.query.minNeetScore) {
      filter.neetScore = { $gte: parseInt(req.query.minNeetScore as string) };
    }
    if (req.query.maxNeetScore) {
      filter.neetScore = { ...filter.neetScore, $lte: parseInt(req.query.maxNeetScore as string) };
    }
    
    if (req.query.minPercentage) {
      filter.percentageOfPlus2Marks = { $gte: parseInt(req.query.minPercentage as string) };
    }
    if (req.query.maxPercentage) {
      filter.percentageOfPlus2Marks = { 
        ...filter.percentageOfPlus2Marks, 
        $lte: parseInt(req.query.maxPercentage as string) 
      };
    }
    
    // Handle fee due filter
    if (req.query.feeDue !== undefined) {
      if (req.query.feeDue === '0') {
        filter.feeDue = 0;
      } else if (req.query.feeDue === '1') {
        filter.feeDue = { $gt: 0 };
      } else {
        const feeDueValue = parseInt(req.query.feeDue as string);
        if (!isNaN(feeDueValue)) {
          filter.feeDue = feeDueValue;
        }
      }
    }
    
    // Handle date range filters
    if (req.query.startDate) {
      filter.createdAt = { $gte: new Date(req.query.startDate as string) };
    }
    if (req.query.endDate) {
      const endDate = new Date(req.query.endDate as string);
      endDate.setHours(23, 59, 59, 999); // Set to end of day
      filter.createdAt = { ...filter.createdAt, $lte: endDate };
    }
    
    // For MENTOR role, only show their assigned students
    if (req.user?.role === "MENTOR") {
      filter.classTeacher = req.user.name;
    }
    
    // Determine sort order
    const sortField = (req.query.sortBy as string) || 'slNo';
    const sortDirection = req.query.sortOrder === 'desc' ? -1 : 1;
    const sortOptions: any = {};
    sortOptions[sortField] = sortDirection;
    
    console.log("Filter:", filter);
    console.log("Sort options:", sortOptions);
    
    // Count total documents for pagination
    const total = await Student.countDocuments(filter);
    
    // Get students with pagination
    const students = await Student.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);
    
    console.log(`Found ${students.length} students out of ${total} total`);
    
    res.json({
      students,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get student by ID
export const getStudentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      res.status(404).json({ message: "Student not found" });
      return;
    }
    
    // Check if user is authorized to view this student
    if (req.user?.role === "MENTOR" && student.classTeacher !== req.user.name) {
      res.status(403).json({ message: "Not authorized to view this student" });
      return;
    }
    
    res.json(student);
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add new student
export const addStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentData = req.body;
    
    // Check if student ID already exists
    const existingStudent = await Student.findOne({ studentId: studentData.studentId });
    if (existingStudent) {
      res.status(400).json({ message: "Student ID already exists" });
      return;
    }
    
    // Create new student
    const student = await Student.create(studentData);
    
    // If mentor is creating a student, assign it to them
    if (req.user?.role === "MENTOR") {
      // Ensure the classTeacher is set to the mentor's name
      student.classTeacher = req.user.name;
  await student.save();
      
      // Add student to mentor's assigned students
      await User.findByIdAndUpdate(req.user.id, {
        $push: { assignedStudents: student._id }
      });
    }
    
    // Log student creation
    await Audit.create({
      user: req.user?.id,
      action: "CREATE",
      entityType: "STUDENT",
      entityId: student._id,
      details: { studentId: student.studentId, name: student.name },
      ipAddress: req.ip
    });
    
    res.status(201).json(student);
  } catch (error) {
    console.error("Error adding student:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update student
export const updateStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.params.id;
    const updateData = req.body;
    
    // Find student by studentId instead of _id
    const student = await Student.findOne({ studentId: studentId });
    if (!student) {
      res.status(404).json({ message: "Student not found" });
      return;
    }
    
    // Check if MENTOR has access to this student
    if (req.user?.role === "MENTOR" && student.classTeacher !== req.user.name) {
      res.status(403).json({ message: "Access denied to update this student record" });
      return;
    }
    
    // Track if class teacher is changing
    const oldClassTeacher = student.classTeacher;
    const newClassTeacher = updateData.classTeacher;
    
    // Update student by studentId instead of _id
    const updatedStudent = await Student.findOneAndUpdate(
      { studentId: studentId },
      updateData,
      { new: true }
    );
    
    // If class teacher changed, update mentor assignments
    if (oldClassTeacher !== newClassTeacher) {
      // If there was a previous teacher, remove student from their list
      if (oldClassTeacher) {
        const oldMentor = await User.findOne({ 
          name: oldClassTeacher,
          role: "MENTOR"
        });
        
        if (oldMentor) {
          await User.findByIdAndUpdate(oldMentor._id, {
            $pull: { assignedStudents: student._id }
          });
        }
      }
      
      // If there's a new teacher, add student to their list
      if (newClassTeacher) {
        const newMentor = await User.findOne({ 
          name: newClassTeacher,
          role: "MENTOR"
        });
        
        if (newMentor) {
          await User.findByIdAndUpdate(newMentor._id, {
            $addToSet: { assignedStudents: student._id }
          });
        }
      }
    }
    
    // Log student update
    await Audit.create({
      user: req.user?.id,
      action: "UPDATE",
      entityType: "STUDENT",
      entityId: student._id,
      details: { 
        studentId: student.studentId, 
        name: student.name,
        changes: Object.keys(updateData).join(', ')
      },
      ipAddress: req.ip
    });
    
    res.json({ 
      message: "Student updated successfully",
      student: updatedStudent
    });
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete student
export const deleteStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.params.id;
    
    // Find student by studentId instead of _id
    const student = await Student.findOne({ studentId: studentId });
    if (!student) {
      res.status(404).json({ message: "Student not found" });
      return;
    }
    
    // Only ADMIN can delete students
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({ message: "Only administrators can delete students" });
      return;
    }
    
    // Remove student from mentor's assigned list
    if (student.classTeacher) {
      const mentor = await User.findOne({ 
        name: student.classTeacher,
        role: "MENTOR"
      });
      
      if (mentor) {
        await User.findByIdAndUpdate(mentor._id, {
          $pull: { assignedStudents: student._id }
        });
      }
    }
    
    // Delete student by studentId instead of _id
    await Student.findOneAndDelete({ studentId: studentId });
    
    // Log student deletion
    await Audit.create({
      user: req.user?.id,
      action: "DELETE",
      entityType: "STUDENT",
      entityId: student._id,
      details: { studentId: student.studentId, name: student.name },
      ipAddress: req.ip
    });
    
    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Helper function to safely convert string to boolean
const safeStringToBoolean = (value: string | undefined | null): boolean => {
  if (value === undefined || value === null || value === '') {
    return false;
  }
  return value === '1' || value === 'true' || value === 'TRUE' || value === 'True' || value === 'yes' || value === 'YES' || value === 'Yes';
};

// Helper function to safely convert to string
const safeToString = (value: any): string => {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value);
};

// Helper function to safely convert to number
const safeToNumber = (value: any): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const num = Number(value);
  return isNaN(num) ? undefined : num;
};

// Helper function to ensure enum values are valid
const ensureValidEnum = (value: string | undefined | null, allowedValues: string[], defaultValue: string): string => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  return allowedValues.includes(value) ? value : defaultValue;
};

// Upload CSV file
export const uploadCSV = async (req: RequestWithFile, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }
    
    // Only ADMIN can upload CSV
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({ message: "Only administrators can upload CSV files" });
      return;
    }
    
    const filePath = req.file.path;
    const results: any[] = [];
    const errors: any[] = [];
    
    // Define allowed enum values
    const genderValues = ["M", "F", "DIFFERENT"];
    const studyMaterialValues = ["NOT RECEIVED", "RECEIVED", "PARTIALLY RECEIVED"];
    const uniformValues = ["NOT RECEIVED", "RECEIVED", "PARTIALLY RECEIVED"];
    const idCardValues = ["NOT RECEIVED", "RECEIVED"];
    const tabValues = ["REQUESTED NOT PAID", "RECEIVED PAID", "RECEIVED NOT PAID", "REQUESTED PAID", "PERSONAL TAB", "NOT REQUIRED"];
    const joinedStatusValues = ["ALLOTED", "DISCONTINUED", "JOINED", "NOT JOINING", "CENTRE CHANGE"];
    const syllabusValues = ["STATE", "CBSE", "ICSE", "OTHER"];
    
    // Parse CSV file
    const parser = fs
      .createReadStream(filePath)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      }));
    
    for await (const record of parser) {
      try {
        // Map CSV columns to student model fields with proper type conversions
        const studentData = {
          slNo: safeToNumber(record['Sl No']),
          name: safeToString(record['NAME']),
          studentId: safeToString(record['STUDENT ID']),
          phoneNumber: safeToString(record['PHONE NUMBER']),
          gender: ensureValidEnum(record['GENDER'], genderValues, "M"),
          batch: safeToString(record['BATCH']),
          classTeacher: safeToString(record['CLASS TEACHER']),
          hostel: safeToString(record['Hostel']),
          stream: safeToString(record['Stream']),
          program: safeToString(record['PROGRAM']),
          studyMaterial: ensureValidEnum(record['Study Material'], studyMaterialValues, "NOT RECEIVED"),
          uniform: ensureValidEnum(record['Uniform'], uniformValues, "NOT RECEIVED"),
          idCard: ensureValidEnum(record['ID Card'], idCardValues, "NOT RECEIVED"),
          tab: ensureValidEnum(record['Tab'], tabValues, "NOT REQUIRED"),
          joined: ensureValidEnum(record['JOINED'], joinedStatusValues, "ALLOTED"),
          syllabus: ensureValidEnum(record['Syllabus'], syllabusValues, "STATE"),
          percentageOfPlus2Marks: safeToNumber(record['Percentage of +2 Marks'] || record['% of +2 Marks']),
          neetScore: safeToNumber(record['NEET Score']),
          remarks: safeToString(record['Remarks']),
          remarks1: safeToString(record['Remarks 1']),
          remarks2: safeToString(record['Remarks 2']),
          remarks3: safeToString(record['Remarks 3']),
          remarks4: safeToString(record['Remarks 4']),
          feeDue: safeToNumber(record['Fee Due']) || 0,
          flag1: safeStringToBoolean(record['Flag1']),
          flag2: safeStringToBoolean(record['Flag2']),
          flag3: safeStringToBoolean(record['Flag3']),
          flag4: safeStringToBoolean(record['Flag4'])
        };
        
        // Validate required fields
        if (!studentData.name || !studentData.studentId) {
          throw new Error("Name and Student ID are required fields");
        }
        
        // Check if student already exists
        const existingStudent = await Student.findOne({ studentId: studentData.studentId });
        
        if (existingStudent) {
          // Update existing student
          await Student.findByIdAndUpdate(existingStudent._id, studentData);
          results.push({ 
            studentId: studentData.studentId, 
            name: studentData.name, 
            status: 'updated' 
          });
        } else {
          // Create new student
          const newStudent = await Student.create(studentData);
          
          // Add student to mentor's assigned list if mentor exists
          if (studentData.classTeacher) {
            const mentor = await User.findOne({ 
              name: studentData.classTeacher,
              role: "MENTOR"
            });
            
            if (mentor) {
              await User.findByIdAndUpdate(mentor._id, {
                $push: { assignedStudents: newStudent._id }
              });
            }
          }
          
          results.push({ 
            studentId: studentData.studentId, 
            name: studentData.name, 
            status: 'created' 
          });
        }
      } catch (error) {
        console.error("Error processing CSV record:", error);
        errors.push({ 
          record, 
          error: (error as Error).message 
        });
      }
    }
    
    // Clean up the temporary file
    fs.unlinkSync(filePath);
    
    // Log CSV upload
    await Audit.create({
      user: req.user?.id,
      action: "UPLOAD",
      entityType: "SYSTEM",
      details: { 
        filename: req.file.originalname,
        recordsProcessed: results.length,
        errors: errors.length
      },
      ipAddress: req.ip
    });
    
    res.json({
      message: "CSV processed successfully",
      results: {
        total: results.length + errors.length,
        successful: results.length,
        failed: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error("Error uploading CSV:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get student statistics for dashboard
export const getStudentStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Base filter for MENTOR role
    const baseFilter = req.user?.role === "MENTOR" 
      ? { classTeacher: req.user.name } 
      : {};
    
    // Total students
    const totalStudents = await Student.countDocuments(baseFilter);
    
    // Students by gender
    const genderStats = await Student.aggregate([
      { $match: baseFilter },
      { $group: { _id: "$gender", count: { $sum: 1 } } }
    ]);
    
    // Students by batch
    const batchStats = await Student.aggregate([
      { $match: baseFilter },
      { $group: { _id: "$batch", count: { $sum: 1 } } }
    ]);
    
    // Students by hostel
    const hostelStats = await Student.aggregate([
      { $match: baseFilter },
      { $group: { _id: "$hostel", count: { $sum: 1 } } }
    ]);
    
    // Students by stream
    const streamStats = await Student.aggregate([
      { $match: baseFilter },
      { $group: { _id: "$stream", count: { $sum: 1 } } }
    ]);
    
    // Students by joined status
    const joinedStats = await Student.aggregate([
      { $match: baseFilter },
      { $group: { _id: "$joined", count: { $sum: 1 } } }
    ]);
    
    // Students with fee due
    const feeDueCount = await Student.countDocuments({
      ...baseFilter,
      feeDue: { $gt: 0 }
    });
    
    // Average NEET score
    const neetScoreAvg = await Student.aggregate([
      { $match: { ...baseFilter, neetScore: { $exists: true, $ne: null } } },
      { $group: { _id: null, average: { $avg: "$neetScore" } } }
    ]);
    
    // Average +2 percentage
    const plus2AvgPercentage = await Student.aggregate([
      { $match: { ...baseFilter, percentageOfPlus2Marks: { $exists: true, $ne: null } } },
      { $group: { _id: null, average: { $avg: "$percentageOfPlus2Marks" } } }
    ]);
    
    res.json({
      totalStudents,
      genderDistribution: genderStats,
      batchDistribution: batchStats,
      hostelDistribution: hostelStats,
      streamDistribution: streamStats,
      joinedStatusDistribution: joinedStats,
      feeDueCount,
      averageNeetScore: neetScoreAvg[0]?.average || 0,
      averagePlus2Percentage: plus2AvgPercentage[0]?.average || 0
    });
  } catch (error) {
    console.error("Error getting student stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};
