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
    
    // Handle new range filter parameters
    if (req.query.neetScoreMin) {
      filter.neetScore = { $gte: parseInt(req.query.neetScoreMin as string) };
    }
    if (req.query.neetScoreMax) {
      filter.neetScore = { ...filter.neetScore, $lte: parseInt(req.query.neetScoreMax as string) };
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
    
    // Handle new percentage range filter parameters
    if (req.query.percentageOfPlus2MarksMin) {
      filter.percentageOfPlus2Marks = { $gte: parseInt(req.query.percentageOfPlus2MarksMin as string) };
    }
    if (req.query.percentageOfPlus2MarksMax) {
      filter.percentageOfPlus2Marks = { 
        ...filter.percentageOfPlus2Marks, 
        $lte: parseInt(req.query.percentageOfPlus2MarksMax as string) 
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
    
    // Set default values for enum fields if they are empty
    if (!studentData.studyMaterial) {
      studentData.studyMaterial = "NOT RECEIVED";
    }
    
    if (!studentData.uniform) {
      studentData.uniform = "NOT RECEIVED";
    }
    
    if (!studentData.idCard) {
      studentData.idCard = "NOT RECEIVED";
    }
    
    if (!studentData.tab) {
      studentData.tab = "NOT REQUIRED";
    }
    
    if (!studentData.joined) {
      studentData.joined = "ALLOTED";
    }
    
    // Create new student
    const student = await Student.create(studentData);
    
    // If mentor is creating a student
    if (req.user?.role === "MENTOR") {
      // Only assign the student to the mentor if the classTeacher matches the mentor's name or username
      if (student.classTeacher === req.user.name || student.classTeacher === req.user.username) {
        // Add student to mentor's assigned students
        await User.findByIdAndUpdate(req.user.id, {
          $push: { assignedStudents: student._id }
        });
      }
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
    if (req.user?.role === "MENTOR") {
      // Check if the class teacher matches either the mentor's name or username
      if (student.classTeacher !== req.user.name && student.classTeacher !== req.user.username) {
        res.status(403).json({ message: "Access denied to update this student record" });
        return;
      }
    }
    
    // Set default values for enum fields if they are empty
    if (updateData.studyMaterial === '') {
      updateData.studyMaterial = "NOT RECEIVED";
    }
    
    if (updateData.uniform === '') {
      updateData.uniform = "NOT RECEIVED";
    }
    
    if (updateData.idCard === '') {
      updateData.idCard = "NOT RECEIVED";
    }
    
    if (updateData.tab === '') {
      updateData.tab = "NOT REQUIRED";
    }
    
    if (updateData.joined === '') {
      updateData.joined = "ALLOTED";
    }
    
    // Store old data for audit
    const oldData = student.toObject();
    
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
    
    // Check if user has permission to delete the student
    if (req.user?.role === "MENTOR") {
      // Mentors can only delete students assigned to them
      if (student.classTeacher !== req.user.name && student.classTeacher !== req.user.username) {
        res.status(403).json({ message: "Access denied to delete this student record" });
        return;
      }
    } else if (req.user?.role !== "ADMIN") {
      // Other roles (if any) cannot delete students
      res.status(403).json({ message: "Only administrators and assigned mentors can delete students" });
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

// Helper function to map CSV column names to model field names
const mapCSVColumnToModelField = (columnName: string): string | null => {
  const mapping: Record<string, string> = {
    'Sl No': 'slNo',
    'NAME': 'name',
    'STUDENT ID': 'studentId',
    'PHONE NUMBER': 'phoneNumber',
    'GENDER': 'gender',
    'BATCH': 'batch',
    'CLASS TEACHER': 'classTeacher',
    'Hostel': 'hostel',
    'Stream': 'stream',
    'PROGRAM': 'program',
    'Study Material': 'studyMaterial',
    'Uniform': 'uniform',
    'ID Card': 'idCard',
    'Tab': 'tab',
    'JOINED': 'joined',
    'Syllabus': 'syllabus',
    'Percentage of +2 Marks': 'percentageOfPlus2Marks',
    '% of +2 Marks': 'percentageOfPlus2Marks',
    'NEET Score': 'neetScore',
    'Remarks': 'remarks',
    'Remarks 1': 'remarks1',
    'Remarks 2': 'remarks2',
    'Remarks 3': 'remarks3',
    'Remarks 4': 'remarks4',
    'Fee Due': 'feeDue',
    'Flag1': 'flag1',
    'Flag2': 'flag2',
    'Flag3': 'flag3',
    'Flag4': 'flag4'
  };
  
  return mapping[columnName] || null;
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
    
    // Get the mode from query parameters (new, update, or combined)
    const mode = req.query.mode as string || 'combined';
    
    // Based on the mode, call the appropriate controller
    if (mode === 'new') {
      return await uploadNewStudentsCSV(req, res);
    } else if (mode === 'update') {
      return await uploadUpdateStudentsCSV(req, res);
    }
    
    // Default behavior (combined mode) continues below
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
          // Create an update object with only the fields that are present in the CSV
          const updateData: Record<string, any> = {};
          
          // Iterate through the record object to check which fields are present in the CSV
          for (const key in record) {
            const mappedKey = mapCSVColumnToModelField(key);
            if (mappedKey && record[key] !== undefined && record[key] !== '') {
              // Only include fields that have values in the CSV
              updateData[mappedKey] = studentData[mappedKey as keyof typeof studentData];
            }
          }
          
          // Update existing student with only the fields from the CSV
          await Student.findByIdAndUpdate(existingStudent._id, updateData);
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
    
    // Count created and updated students
    const createdCount = results.filter(r => r.status === 'created').length;
    const updatedCount = results.filter(r => r.status === 'updated').length;
    
    // Log CSV upload
    await Audit.create({
      user: req.user?.id,
      action: "UPLOAD",
      entityType: "SYSTEM",
      details: { 
        filename: req.file.originalname,
        recordsProcessed: results.length,
        created: createdCount,
        updated: updatedCount,
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
      details: {
        created: createdCount,
        updated: updatedCount
      }
    });
  } catch (error) {
    console.error("Error uploading CSV:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get student statistics for dashboard
export const getStudentStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Base filter - no restrictions for mentors as they should see all students
    const baseFilter = {};
    
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

// Upload CSV file for new students only
export const uploadNewStudentsCSV = async (req: RequestWithFile, res: Response): Promise<void> => {
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
    
    // Create an error log file
    const errorLogPath = `src/uploads/error_log_${Date.now()}.json`;
    
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
        
        // Check if student already exists - for new students, this is an error
        const existingStudent = await Student.findOne({ studentId: studentData.studentId });
        
        if (existingStudent) {
          throw new Error(`Student ID ${studentData.studentId} already exists`);
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
          error: (error as Error).message,
          line: parser.info.lines
        });
      }
    }
    
    // Write errors to log file if there are any
    if (errors.length > 0) {
      fs.writeFileSync(errorLogPath, JSON.stringify(errors, null, 2));
    }
    
    // Clean up the temporary file
    fs.unlinkSync(filePath);
    
    // Log CSV upload
    await Audit.create({
      user: req.user?.id,
      action: "UPLOAD_NEW",
      entityType: "SYSTEM",
      details: { 
        filename: req.file.originalname,
        recordsProcessed: results.length + errors.length,
        created: results.length,
        errors: errors.length,
        errorLogPath: errors.length > 0 ? errorLogPath : null
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
      details: {
        created: results.length
      },
      errorLog: errors.length > 0 ? errorLogPath : null
    });
  } catch (error) {
    console.error("Error uploading CSV:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Upload CSV file for updating existing students
export const uploadUpdateStudentsCSV = async (req: RequestWithFile, res: Response): Promise<void> => {
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
    
    // Create an error log file
    const errorLogPath = `src/uploads/error_log_${Date.now()}.json`;
    
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
        
        // Check if student exists - for updates, student must exist
        const existingStudent = await Student.findOne({ studentId: studentData.studentId });
        
        if (!existingStudent) {
          throw new Error(`Student ID ${studentData.studentId} does not exist`);
        } else {
          // Track if class teacher is changing
          const oldClassTeacher = existingStudent.classTeacher;
          const newClassTeacher = studentData.classTeacher;
          
          // Create an update object with only the fields that are present in the CSV
          const updateData: Record<string, any> = {};
          
          // Iterate through the record object to check which fields are present in the CSV
          for (const key in record) {
            const mappedKey = mapCSVColumnToModelField(key);
            if (mappedKey && record[key] !== undefined && record[key] !== '') {
              // Only include fields that have values in the CSV
              updateData[mappedKey] = studentData[mappedKey as keyof typeof studentData];
            }
          }
          
          // Update existing student with only the fields from the CSV
          await Student.findByIdAndUpdate(existingStudent._id, updateData);
          
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
                  $pull: { assignedStudents: existingStudent._id }
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
                  $addToSet: { assignedStudents: existingStudent._id }
                });
              }
            }
          }
          
          results.push({ 
            studentId: studentData.studentId, 
            name: studentData.name, 
            status: 'updated' 
          });
        }
      } catch (error) {
        console.error("Error processing CSV record:", error);
        errors.push({ 
          record, 
          error: (error as Error).message,
          line: parser.info.lines
        });
      }
    }
    
    // Write errors to log file if there are any
    if (errors.length > 0) {
      fs.writeFileSync(errorLogPath, JSON.stringify(errors, null, 2));
    }
    
    // Clean up the temporary file
    fs.unlinkSync(filePath);
    
    // Log CSV upload
    await Audit.create({
      user: req.user?.id,
      action: "UPLOAD_UPDATE",
      entityType: "SYSTEM",
      details: { 
        filename: req.file.originalname,
        recordsProcessed: results.length + errors.length,
        updated: results.length,
        errors: errors.length,
        errorLogPath: errors.length > 0 ? errorLogPath : null
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
      details: {
        updated: results.length
      },
      errorLog: errors.length > 0 ? errorLogPath : null
    });
  } catch (error) {
    console.error("Error uploading CSV:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Find student by studentId
export const findStudent = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    
    const student = await Student.findOne({ studentId }).lean();
    
    if (!student) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }
    
    res.status(200).json(student);
  } catch (error) {
    console.error('Error finding student:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
