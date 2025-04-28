import { Request, Response } from "express";
import Hour from "../models/hour.model";
import Audit from "../models/audit.model";
import mongoose from "mongoose";
import Config from "../models/config.model";

// Get all hours with pagination and filtering
export const getAllHours = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Get sort parameters from request
    const sortBy = req.query.sortBy as string || 'updatedAt';
    const sortOrder = req.query.sortOrder as string || 'desc';
    
    // Create sort object for MongoDB
    const sort: Record<string, any> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    console.log(`Sorting by ${sortBy} in ${sortOrder} order`);
    
    // Build filter object
    const filter: any = {};
    
    // Add search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      filter.$or = [
        { batch: searchRegex },
        { subject: searchRegex },
        { chapter: searchRegex },
        { mode: searchRegex },
        { classTeacher: searchRegex }
      ];
    }
    
    // Add specific filters
    if (req.query.batch) filter.batch = req.query.batch;
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.chapter) filter.chapter = new RegExp(req.query.chapter as string, 'i');
    if (req.query.mode) filter.mode = req.query.mode;
    if (req.query.classTeacher) filter.classTeacher = req.query.classTeacher;
    if (req.query.chapterStatus) filter.chapterStatus = req.query.chapterStatus;
    
    // For MENTOR role, only show their hours
    if (req.user?.role === "MENTOR") {
      // Get the mentor's name and username
      const mentorName = req.user.name;
      const mentorUsername = req.user.username;
      const mentorBatch = (req.user as any).class; // Get mentor's assigned batch/class
      
      console.log(`Filtering hours for mentor: ${mentorName} (${mentorUsername}), assigned to batch: ${mentorBatch}`);
      
      // Restrict to mentor's batch, but only if they have a batch assigned
      if (mentorBatch && mentorBatch.trim() !== '') {
        filter.batch = mentorBatch;
      }
      
      // Use a case-insensitive regex to match either the mentor's name or username
      // This provides flexibility during the transition to using usernames
      const classTeacherFilter = [
        { classTeacher: new RegExp(`^${mentorName}$`, 'i') },
        { classTeacher: new RegExp(`^${mentorUsername}$`, 'i') }
      ];
      
      // Combine batch and classTeacher filters
      if (filter.$or) {
        // If there's already an $or from search, we need to use $and to combine conditions
        filter.$and = [
          { $or: filter.$or },
          { $or: classTeacherFilter }
        ];
        delete filter.$or;
      } else {
        filter.$or = classTeacherFilter;
      }
      
      console.log("Filter applied:", filter);
    }
    
    // Get total count for pagination
    const totalHours = await Hour.countDocuments(filter);
    
    // Get hours with pagination
    const hours = await Hour.find(filter)
      .sort(sort) // Use the dynamic sort object
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name username')
      .populate('updatedBy', 'name username');
    
    // Format response to match frontend expectations
    res.json({
      hours,
      totalHours,
      totalPages: Math.ceil(totalHours / limit)
    });
  } catch (error) {
    console.error("Error fetching hours:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get hour by ID
export const getHourById = async (req: Request, res: Response): Promise<void> => {
  try {
    const hourId = req.params.id;
    
    const hour = await Hour.findById(hourId)
      .populate('createdBy', 'name username')
      .populate('updatedBy', 'name username');
    
    if (!hour) {
      res.status(404).json({ message: "Hour not found" });
      return;
    }
    
    // Check if MENTOR has access to this hour
    if (req.user?.role === "MENTOR") {
      const mentorName = req.user.name;
      const mentorUsername = req.user.username;
      const mentorBatch = (req.user as any).class; // Get mentor's assigned batch/class
      
      // Check if mentor is viewing an hour for their own batch, but only if they have a batch assigned
      if (mentorBatch && mentorBatch.trim() !== '' && hour.batch !== mentorBatch) {
        res.status(403).json({ message: "Mentors can only view hours for their own batch" });
        return;
      }
      
      // Case-insensitive comparison with either name or username
      if ((hour.classTeacher as string).toLowerCase() !== mentorName.toLowerCase() && 
          (hour.classTeacher as string).toLowerCase() !== mentorUsername.toLowerCase()) {
        res.status(403).json({ message: "Access denied to view this hour" });
        return;
      }
    }
    
    res.json({ hour });
  } catch (error) {
    console.error("Error fetching hour:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add new hour
export const addHour = async (req: Request, res: Response): Promise<void> => {
  try {
    const hourData = req.body;
    
    // Validate required fields
    if (!hourData.batch || !hourData.subject || !hourData.chapter || !hourData.mode || !hourData.classTeacher) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }
    
    // Check if MENTOR is adding for their own class
    if (req.user?.role === "MENTOR") {
      const mentorName = req.user.name;
      const mentorUsername = req.user.username;
      const mentorBatch = (req.user as any).class; // Get mentor's assigned batch/class
      
      console.log(`Mentor ${mentorName} (${mentorUsername}) is adding an hour for batch: ${hourData.batch}, assigned to batch: ${mentorBatch}`);
      
      // Check if mentor is adding for their own batch, but only if they have a batch assigned
      if (mentorBatch && mentorBatch.trim() !== '' && hourData.batch !== mentorBatch) {
        res.status(403).json({ message: "Mentors can only add hours for their own batch" });
        return;
      }
      
      // Set the classTeacher to their username
      hourData.classTeacher = mentorUsername;
      console.log(`Setting classTeacher to username format: ${mentorUsername}`);
    }
    
    // Add audit trail
    hourData.createdBy = req.user?.id;
    
    // Calculate remaining hours
    if (hourData.allotedHours && hourData.completedHours) {
      hourData.remainingHoursNeeded = Math.max(0, hourData.allotedHours - hourData.completedHours);
    }
    
    // Handle faculty data - convert from old format if needed
    if (!hourData.faculties) {
      hourData.faculties = [];
      
      // Convert from old format if present
      if (hourData.faculty1) {
        if (typeof hourData.faculty1 === 'object' && (hourData.faculty1.code || hourData.faculty1.name)) {
          hourData.faculties.push({
            code: hourData.faculty1.code || '',
            name: hourData.faculty1.name || ''
          });
        }
        delete hourData.faculty1;
      }
      
      if (hourData.faculty2) {
        if (typeof hourData.faculty2 === 'object' && (hourData.faculty2.code || hourData.faculty2.name)) {
          hourData.faculties.push({
            code: hourData.faculty2.code || '',
            name: hourData.faculty2.name || ''
          });
        }
        delete hourData.faculty2;
      }
      
      if (hourData.faculty3) {
        if (typeof hourData.faculty3 === 'object' && (hourData.faculty3.code || hourData.faculty3.name)) {
          hourData.faculties.push({
            code: hourData.faculty3.code || '',
            name: hourData.faculty3.name || ''
          });
        }
        delete hourData.faculty3;
      }
    }
    
    // Ensure faculties is an array
    if (!Array.isArray(hourData.faculties)) {
      hourData.faculties = [];
    }
    
    // Filter out empty faculty entries
    hourData.faculties = hourData.faculties.filter(
      (faculty: any) => faculty && typeof faculty === 'object' && (faculty.code || faculty.name)
    );
    
    // Handle examDate specifically to avoid common date parsing issues
    if (hourData.examDate && typeof hourData.examDate === 'string') {
      // Check if it needs special parsing
      if (/^\d{2}-\d{2}-\d{4}$/.test(hourData.examDate)) {
        try {
          const [day, month, year] = hourData.examDate.split('-').map((part: string) => parseInt(part, 10));
          // JavaScript months are 0-indexed
          const dateObj = new Date(year, month - 1, day);
          
          if (!isNaN(dateObj.getTime())) {
            console.log(`Manually parsed examDate from DD-MM-YYYY format: ${dateObj.toISOString()}`);
            hourData.examDate = dateObj;
          }
        } catch (err) {
          console.error(`Error parsing examDate (DD-MM-YYYY): ${err}`);
        }
      } else {
        // Try regular Date constructor
        try {
          const dateObj = new Date(hourData.examDate);
          if (!isNaN(dateObj.getTime())) {
            console.log(`Parsed examDate using Date constructor: ${dateObj.toISOString()}`);
            hourData.examDate = dateObj;
          }
        } catch (err) {
          console.error(`Error parsing examDate: ${err}`);
        }
      }
    }
    
    const hour = new Hour(hourData);
    await hour.save();
    
    // If we still have examDate issues, try to update it separately
    if (hourData.examDate && typeof hourData.examDate === 'string' && hour._id) {
      try {
        // Use the specialized function for converting to ISO format
        const isoDateString = convertToISODateString(hourData.examDate);
        if (isoDateString) {
          console.log(`Updating examDate in a separate step: ${isoDateString}`);
          await Hour.updateOne(
            { _id: hour._id },
            { $set: { examDate: new Date(isoDateString) } }
          );
        }
      } catch (err) {
        console.error(`Error updating examDate separately: ${err}`);
      }
    }
    
    // Log the action
    await Audit.create({
      user: req.user?.id,
      action: "CREATE",
      entityType: "HOUR",
      entityId: hour._id,
      details: { hour: hourData }
    });
    
    res.status(201).json({ 
      message: "Hour added successfully", 
      hour 
    });
  } catch (error) {
    console.error("Error adding hour:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update hour
export const updateHour = async (req: Request, res: Response): Promise<void> => {
  try {
    const hourId = req.params.id;
    const updateData = req.body;
    
    // Find hour
    const hour = await Hour.findById(hourId);
    if (!hour) {
      res.status(404).json({ message: "Hour not found" });
      return;
    }
    
    // Check if MENTOR has access to update this hour
    if (req.user?.role === "MENTOR") {
      const mentorName = req.user.name;
      const mentorUsername = req.user.username;
      const mentorBatch = (req.user as any).class; // Get mentor's assigned batch/class
      
      console.log(`Mentor ${mentorName} (${mentorUsername}) is trying to update hour with classTeacher: ${hour.classTeacher} and batch: ${hour.batch}`);
      console.log(`Update data:`, JSON.stringify(updateData));
      
      // Check if mentor is updating an hour for their own batch, but only if they have a batch assigned
      if (mentorBatch && mentorBatch.trim() !== '' && hour.batch !== mentorBatch) {
        res.status(403).json({ message: "Mentors can only update hours for their own batch" });
        return;
      }
      
      // Case-insensitive comparison with either name or username
      if ((hour.classTeacher as string).toLowerCase() !== mentorName.toLowerCase() && 
          (hour.classTeacher as string).toLowerCase() !== mentorUsername.toLowerCase()) {
        res.status(403).json({ message: "Access denied to update this hour" });
        return;
      }
      
      // For mentors, only restrict changing the classTeacher field
      // Since mentors and class teachers are the same, they should be able to update most fields
      if (updateData.classTeacher !== undefined && 
          updateData.classTeacher.toLowerCase() !== mentorUsername.toLowerCase()) {
        console.log("Mentor attempted to change classTeacher field:", updateData.classTeacher);
        res.status(403).json({ message: "You cannot change the classTeacher field" });
        return;
      }
      
      // Prevent mentors from changing the batch
      if (updateData.batch !== undefined && updateData.batch !== hour.batch) {
        console.log("Mentor attempted to change batch field:", updateData.batch);
        res.status(403).json({ message: "You cannot change the batch field" });
        return;
      }
      
      // Preserve the original classTeacher value (with original capitalization)
      // This ensures consistency in how the name is stored
      updateData.classTeacher = hour.classTeacher as string;
    }
    
    // Store old data for audit
    const oldData = hour.toObject();
    
    // Add audit trail
    updateData.updatedBy = req.user?.id;
    
    // Calculate remaining hours if allotedHours or completedHours is updated
    if (updateData.allotedHours !== undefined || updateData.completedHours !== undefined) {
      const allotedHours = updateData.allotedHours !== undefined ? updateData.allotedHours : hour.allotedHours;
      const completedHours = updateData.completedHours !== undefined ? updateData.completedHours : hour.completedHours;
      updateData.remainingHoursNeeded = Math.max(0, allotedHours - completedHours);
    }
    
    // Handle exam date specifically to avoid common date parsing issues
    if (updateData.examDate && typeof updateData.examDate === 'string') {
      console.log(`Processing examDate: "${updateData.examDate}"`);
      // Store original for later use
      const originalExamDateString = updateData.examDate;
      let parsedSuccessfully = false;
      
      // Try DD-MM-YYYY format first
      if (/^\d{2}-\d{2}-\d{4}$/.test(originalExamDateString)) {
        try {
          const parts = originalExamDateString.split('-');
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // months are 0-indexed
          const year = parseInt(parts[2], 10);
          
          const dateObj = new Date(year, month, day);
          
          if (!isNaN(dateObj.getTime())) {
            console.log(`Parsed examDate: ${dateObj.toISOString()}`);
            updateData.examDate = dateObj;
            parsedSuccessfully = true;
          }
        } catch (err) {
          console.error(`Error parsing DD-MM-YYYY date: ${err}`);
        }
      }
      
      // If not parsed yet, try standard Date
      if (!parsedSuccessfully) {
        try {
          const dateObj = new Date(originalExamDateString);
          if (!isNaN(dateObj.getTime())) {
            console.log(`Parsed examDate with standard Date: ${dateObj.toISOString()}`);
            updateData.examDate = dateObj;
            parsedSuccessfully = true;
          }
        } catch (err) {
          console.error(`Error parsing with standard Date: ${err}`);
        }
      }
      
      // If still not parsed, will handle after initial update
      if (!parsedSuccessfully) {
        console.log(`Could not parse examDate conventionally, will try direct update later`);
        // Remove from updateData to avoid invalid date
        delete updateData.examDate;
      }
    }
    
    // Handle faculty data - convert from old format if needed
    if (updateData.faculty1 || updateData.faculty2 || updateData.faculty3) {
      // Initialize faculties array if not present
      if (!updateData.faculties) {
        updateData.faculties = [...(hour.faculties || [])];
      }
      
      // Convert from old format if present
      if (updateData.faculty1) {
        if (typeof updateData.faculty1 === 'object' && (updateData.faculty1.code || updateData.faculty1.name)) {
          // Update or add faculty1
          if (updateData.faculties[0]) {
            updateData.faculties[0] = {
              ...updateData.faculties[0],
              code: updateData.faculty1.code || updateData.faculties[0].code || '',
              name: updateData.faculty1.name || updateData.faculties[0].name || ''
            };
          } else {
            updateData.faculties[0] = {
              code: updateData.faculty1.code || '',
              name: updateData.faculty1.name || ''
            };
          }
        }
        delete updateData.faculty1;
      }
      
      if (updateData.faculty2) {
        if (typeof updateData.faculty2 === 'object' && (updateData.faculty2.code || updateData.faculty2.name)) {
          // Update or add faculty2
          if (updateData.faculties[1]) {
            updateData.faculties[1] = {
              ...updateData.faculties[1],
              code: updateData.faculty2.code || updateData.faculties[1].code || '',
              name: updateData.faculty2.name || updateData.faculties[1].name || ''
            };
          } else {
            updateData.faculties[1] = {
              code: updateData.faculty2.code || '',
              name: updateData.faculty2.name || ''
            };
          }
        }
        delete updateData.faculty2;
      }
      
      if (updateData.faculty3) {
        if (typeof updateData.faculty3 === 'object' && (updateData.faculty3.code || updateData.faculty3.name)) {
          // Update or add faculty3
          if (updateData.faculties[2]) {
            updateData.faculties[2] = {
              ...updateData.faculties[2],
              code: updateData.faculty3.code || updateData.faculties[2].code || '',
              name: updateData.faculty3.name || updateData.faculties[2].name || ''
            };
          } else {
            updateData.faculties[2] = {
              code: updateData.faculty3.code || '',
              name: updateData.faculty3.name || ''
            };
          }
        }
        delete updateData.faculty3;
      }
    }
    
    // Ensure faculties is an array if present
    if (updateData.faculties && !Array.isArray(updateData.faculties)) {
      updateData.faculties = [];
    }
    
    // Filter out empty faculty entries if present
    if (updateData.faculties) {
      updateData.faculties = updateData.faculties.filter(
        (faculty: any) => faculty && typeof faculty === 'object' && (faculty.code || faculty.name)
      );
    }
    
    // Update hour
    const updatedHour = await Hour.findByIdAndUpdate(
      hourId,
      updateData,
      { new: true }
    ).populate('createdBy', 'name username')
     .populate('updatedBy', 'name username');
    
    // If we couldn't parse examDate earlier and we have the original string
    if (typeof req.body.examDate === 'string' && !updateData.examDate) {
      try {
        const originalExamDateString = req.body.examDate;
        console.log(`Attempting direct update of examDate: "${originalExamDateString}"`);
        
        // Try converting to ISO format
        const isoDateString = convertToISODateString(originalExamDateString);
        if (isoDateString) {
          console.log(`Converting to ISO date: ${isoDateString}`);
          
          await Hour.updateOne(
            { _id: hourId },
            { $set: { examDate: new Date(isoDateString) } }
          );
          
          console.log('ExamDate updated directly');
        }
      } catch (err) {
        console.error(`Error updating examDate directly: ${err}`);
      }
    }
    
    // Log the action
    await Audit.create({
      user: req.user?.id,
      action: "UPDATE",
      entityType: "HOUR",
      entityId: hour._id,
      details: { 
        oldData,
        newData: updateData
      }
    });
    
    res.json({ 
      message: "Hour updated successfully", 
      hour: updatedHour 
    });
  } catch (error) {
    console.error("Error updating hour:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete hour
export const deleteHour = async (req: Request, res: Response): Promise<void> => {
  try {
    const hourId = req.params.id;
    
    // Find hour
    const hour = await Hour.findById(hourId);
    if (!hour) {
      res.status(404).json({ message: "Hour not found" });
      return;
    }
    
    // Check if MENTOR has access to delete this hour
    if (req.user?.role === "MENTOR") {
      const mentorName = req.user.name;
      const mentorUsername = req.user.username;
      const mentorBatch = (req.user as any).class; // Get mentor's assigned batch/class
      
      console.log(`Mentor ${mentorName} (${mentorUsername}) is trying to delete hour with classTeacher: ${hour.classTeacher} and batch: ${hour.batch}`);
      
      // Check if mentor is deleting an hour for their own batch, but only if they have a batch assigned
      if (mentorBatch && mentorBatch.trim() !== '' && hour.batch !== mentorBatch) {
        res.status(403).json({ message: "Mentors can only delete hours for their own batch" });
        return;
      }
      
      // Case-insensitive comparison with either name or username
      if ((hour.classTeacher as string).toLowerCase() !== mentorName.toLowerCase() && 
          (hour.classTeacher as string).toLowerCase() !== mentorUsername.toLowerCase()) {
        res.status(403).json({ message: "Access denied to delete this hour" });
        return;
      }
    }
    
    // Store data for audit
    const hourData = hour.toObject();
    
    // Delete hour
    await Hour.findByIdAndDelete(hourId);
    
    // Log the action
    await Audit.create({
      user: req.user?.id,
      action: "DELETE",
      entityType: "HOUR",
      entityId: hour._id,
      details: { hour: hourData }
    });
    
    res.json({ message: "Hour deleted successfully" });
  } catch (error) {
    console.error("Error deleting hour:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get hour statistics
export const getHourStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const batch = req.query.batch as string;
    
    // Build match stage for aggregation
    const matchStage: any = {};
    
    // Add batch filter if provided
    if (batch) {
      matchStage.batch = batch;
    }
    
    // For MENTOR role, only show their hours
    if (req.user?.role === "MENTOR") {
      const mentorName = req.user.name;
      const mentorUsername = req.user.username;
      const mentorBatch = (req.user as any).class; // Get mentor's assigned batch/class
      
      // Restrict to mentor's batch, but only if they have a batch assigned
      if (mentorBatch && mentorBatch.trim() !== '') {
        matchStage.batch = mentorBatch;
      }
      
      // Use $or to match either name or username
      matchStage.$or = [
        { classTeacher: new RegExp(`^${mentorName}$`, 'i') },
        { classTeacher: new RegExp(`^${mentorUsername}$`, 'i') }
      ];
    }
    
    // Get statistics by subject
    const subjectStats = await Hour.aggregate([
      { $match: matchStage },
      { 
        $group: {
          _id: "$subject",
          totalAllotedHours: { $sum: "$allotedHours" },
          totalCompletedHours: { $sum: "$completedHours" },
          totalRemainingHours: { $sum: { $max: [0, { $subtract: ["$allotedHours", "$completedHours"] }] } },
          completionPercentage: { 
            $avg: { 
              $cond: [
                { $eq: ["$allotedHours", 0] },
                0,
                { $multiply: [{ $divide: ["$completedHours", "$allotedHours"] }, 100] }
              ]
            }
          }
        }
      },
      {
        $project: {
          subject: "$_id",
          totalAllotedHours: 1,
          totalCompletedHours: 1,
          totalRemainingHours: 1,
          completionPercentage: { $round: ["$completionPercentage", 1] },
          _id: 0
        }
      },
      { $sort: { subject: 1 } }
    ]);
    
    // Get statistics by batch and subject
    const batchStats = await Hour.aggregate([
      { $match: matchStage },
      { 
        $group: {
          _id: { batch: "$batch", subject: "$subject" },
          totalAllotedHours: { $sum: "$allotedHours" },
          totalCompletedHours: { $sum: "$completedHours" },
          totalRemainingHours: { $sum: { $max: [0, { $subtract: ["$allotedHours", "$completedHours"] }] } },
          completedChapters: { $sum: { $cond: [{ $eq: ["$chapterStatus", "COMPLETED"] }, 1, 0] } },
          ongoingChapters: { $sum: { $cond: [{ $eq: ["$chapterStatus", "ONGOING"] }, 1, 0] } },
          notStartedChapters: { $sum: { $cond: [{ $eq: ["$chapterStatus", "NOT STARTED"] }, 1, 0] } },
          totalChapters: { $sum: 1 },
          completionPercentage: { 
            $avg: { 
              $cond: [
                { $eq: ["$allotedHours", 0] },
                0,
                { $multiply: [{ $divide: ["$completedHours", "$allotedHours"] }, 100] }
              ]
            }
          }
        }
      },
      {
        $project: {
          batch: "$_id.batch",
          subject: "$_id.subject",
          totalAllotedHours: 1,
          totalCompletedHours: 1,
          totalRemainingHours: 1,
          completedChapters: 1,
          ongoingChapters: 1,
          notStartedChapters: 1,
          totalChapters: 1,
          completionPercentage: { $round: ["$completionPercentage", 1] },
          _id: 0
        }
      },
      { $sort: { batch: 1, subject: 1 } }
    ]);
    
    // Get statistics by chapter status
    const chapterStatusStats = await Hour.aggregate([
      { $match: matchStage },
      { 
        $group: {
          _id: "$chapterStatus",
          count: { $sum: 1 },
          totalHours: { $sum: "$completedHours" }
        }
      },
      {
        $project: {
          status: "$_id",
          count: 1,
          totalHours: 1,
          _id: 0
        }
      },
      { $sort: { status: 1 } }
    ]);
    
    // Get overall statistics
    const overallStats = await Hour.aggregate([
      { $match: matchStage },
      { 
        $group: {
          _id: null,
          totalAllotedHours: { $sum: "$allotedHours" },
          totalCompletedHours: { $sum: "$completedHours" },
          totalRemainingHours: { $sum: { $max: [0, { $subtract: ["$allotedHours", "$completedHours"] }] } },
          totalEntries: { $sum: 1 },
          averageMarks: { $avg: "$averageMarksOfBatch" },
          totalAPlus: { $sum: "$numberOfAPlus" }
        }
      },
      {
        $project: {
          _id: 0,
          totalAllotedHours: 1,
          totalCompletedHours: 1,
          totalRemainingHours: 1,
          totalEntries: 1,
          averageMarks: { $round: ["$averageMarks", 1] },
          totalAPlus: 1,
          completionPercentage: { 
            $round: [
              { 
                $cond: [
                  { $eq: ["$totalAllotedHours", 0] },
                  0,
                  { $multiply: [{ $divide: ["$totalCompletedHours", "$totalAllotedHours"] }, 100] }
                ]
              },
              1
            ]
          }
        }
      }
    ]);
    
    // Get statistics by month
    const hoursByMonth = await Hour.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          totalHours: { $sum: "$completedHours" }
        }
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          totalHours: 1
        }
      },
      { $sort: { year: 1, month: 1 } },
      {
        $project: {
          month: {
            $let: {
              vars: {
                monthsInString: [
                  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
                ]
              },
              in: {
                $concat: [
                  { $arrayElemAt: ["$$monthsInString", "$month"] },
                  " ",
                  { $toString: "$year" }
                ]
              }
            }
          },
          totalHours: 1
        }
      }
    ]);
    
    // Get statistics by mode
    const hoursByMode = await Hour.aggregate([
      { $match: matchStage },
      { 
        $group: {
          _id: "$mode",
          totalHours: { $sum: "$completedHours" }
        }
      },
      {
        $project: {
          mode: "$_id",
          totalHours: 1,
          _id: 0
        }
      },
      { $sort: { mode: 1 } }
    ]);
    
    // Get statistics by subject
    const hoursBySubject = await Hour.aggregate([
      { $match: matchStage },
      { 
        $group: {
          _id: "$subject",
          totalHours: { $sum: "$completedHours" }
        }
      },
      {
        $project: {
          subject: "$_id",
          totalHours: 1,
          _id: 0
        }
      },
      { $sort: { subject: 1 } }
    ]);
    
    // Get statistics by status
    const hoursByStatus = await Hour.aggregate([
      { $match: matchStage },
      { 
        $group: {
          _id: "$chapterStatus",
          totalHours: { $sum: "$completedHours" }
        }
      },
      {
        $project: {
          status: "$_id",
          totalHours: 1,
          _id: 0
        }
      },
      { $sort: { status: 1 } }
    ]);
    
    res.json({
      stats: {
        subjectStats,
        batchStats,
        chapterStatusStats,
        overallStats: overallStats[0] || {
          totalAllotedHours: 0,
          totalCompletedHours: 0,
          totalRemainingHours: 0,
          totalEntries: 0,
          averageMarks: 0,
          totalAPlus: 0,
          completionPercentage: 0
        },
        hoursByMonth,
        hoursByMode,
        hoursBySubject,
        hoursByStatus,
        totalHours: overallStats[0]?.totalCompletedHours || 0,
        totalChapters: await Hour.countDocuments(matchStage),
        completionRate: overallStats[0]?.completionPercentage || 0
      }
    });
  } catch (error) {
    console.error("Error fetching hour stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get chapter status
export const getChapterStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const batch = req.query.batch as string;
    const subject = req.query.subject as string;
    
    if (!batch) {
      res.status(400).json({ message: "Batch is required" });
      return;
    }
    
    // Build match stage for aggregation
    const matchStage: any = { batch };
    
    // Add subject filter if provided
    if (subject) {
      matchStage.subject = subject;
    }
    
    // For MENTOR role, only show their chapters
    if (req.user?.role === "MENTOR") {
      const mentorName = req.user.name;
      const mentorUsername = req.user.username;
      const mentorBatch = (req.user as any).class; // Get mentor's assigned batch/class
      
      // Restrict to mentor's batch, but only if they have a batch assigned
      if (mentorBatch && mentorBatch.trim() !== '' && batch !== mentorBatch) {
        res.status(403).json({ message: "Mentors can only view chapter status for their own batch" });
        return;
      }
      
      // Use $or to match either name or username
      matchStage.$or = [
        { classTeacher: new RegExp(`^${mentorName}$`, 'i') },
        { classTeacher: new RegExp(`^${mentorUsername}$`, 'i') }
      ];
    }
    
    const chapters = await Hour.find(matchStage)
      .select('chapter chapterStatus allotedHours completedHours updatedAt')
      .sort({ chapter: 1 });
    
    const formattedChapters = chapters.map(chapter => {
      // Add proper type casting for the chapter properties
      const allotedHours = Number(chapter.allotedHours) || 0;
      const completedHours = Number(chapter.completedHours) || 0;
      
      const progress = allotedHours > 0 
        ? Math.round((completedHours / allotedHours) * 100) 
        : 0;
      
      return {
        chapter: chapter.chapter,
        status: chapter.chapterStatus,
        progress: progress > 100 ? 100 : progress,
        totalHours: completedHours,
        allotedHours: allotedHours,
        completedHours: completedHours,
        remainingHours: Math.max(0, allotedHours - completedHours),
        lastUpdated: chapter.updatedAt
      };
    });
    
    res.json({ chapters: formattedChapters });
  } catch (error) {
    console.error("Error fetching chapter status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get options for dropdowns
export const getHourOptions = async (req: Request, res: Response): Promise<void> => {
  try {
    // For MENTOR role, only show their options
    const matchStage: any = {};
    if (req.user?.role === "MENTOR") {
      const mentorName = req.user.name;
      const mentorUsername = req.user.username;
      const mentorBatch = (req.user as any).class; // Get mentor's assigned batch/class
      
      // Restrict to mentor's batch, but only if they have a batch assigned
      if (mentorBatch && mentorBatch.trim() !== '') {
        matchStage.batch = mentorBatch;
      }
      
      // Use $or to match either name or username
      matchStage.$or = [
        { classTeacher: new RegExp(`^${mentorName}$`, 'i') },
        { classTeacher: new RegExp(`^${mentorUsername}$`, 'i') }
      ];
    }
    
    // Get batches from configuration
    const batchConfig = await Config.findOne({ category: 'batches' });
    const batches = batchConfig ? batchConfig.values : [];
    
    // Get class teachers from configuration
    const teacherConfig = await Config.findOne({ category: 'classTeachers' });
    const classTeachers = teacherConfig ? teacherConfig.values : [];
    
    // Get unique subjects - use predefined subjects
    const predefinedSubjects = ['PHYSICS', 'CHEMISTRY', 'BOTANY', 'ZOOLOGY', 'MATHS'];
    
    // Get unique modes from database
    const modesFromDB = await Hour.distinct('mode', matchStage);
    
    // Ensure both ONLINE and OFFLINE are always included
    const modes = Array.from(new Set([...modesFromDB, 'ONLINE', 'OFFLINE'])).sort();
    
    // For mentors, filter batches to only show their assigned batch
    let filteredBatches = batches;
    if (req.user?.role === "MENTOR") {
      const mentorBatch = (req.user as any).class;
      if (mentorBatch && mentorBatch.trim() !== '') {
        filteredBatches = batches.filter(batch => batch === mentorBatch);
      }
    }
    
    res.json({
      options: {
        batches: filteredBatches.sort(),
        subjects: predefinedSubjects,
        modes: modes,
        classTeachers: classTeachers.sort()
      }
    });
  } catch (error) {
    console.error("Error fetching hour options:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Parse date from different formats
 */
const parseDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  dateString = dateString.trim();
  
  // Try DD-MM-YYYY format
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split('-').map(part => parseInt(part, 10));
    // Note: month is 0-indexed in JavaScript Date
    const date = new Date(year, month - 1, day);
    // Check if valid date
    if (!isNaN(date.getTime())) return date;
  }
  
  // Try MM/DD/YYYY format
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
    const [month, day, year] = dateString.split('/').map(part => parseInt(part, 10));
    const date = new Date(year, month - 1, day);
    if (!isNaN(date.getTime())) return date;
  }
  
  // Try YYYY-MM-DD format (ISO format)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) return date;
  }
  
  // If nothing works, try direct parsing
  const parsedDate = new Date(dateString);
  if (!isNaN(parsedDate.getTime())) return parsedDate;
  
  console.error(`Failed to parse date: ${dateString}`);
  return null;
};

/**
 * Map status values to valid enum values
 */
const mapChapterStatus = (status: string): string => {
  if (!status) return 'NOT STARTED';
  
  const statusLower = status.trim().toLowerCase();
  
  if (statusLower === 'completed' || statusLower === 'complete') {
    return 'COMPLETED';
  }
  
  if (statusLower === 'ongoing' || statusLower === 'in progress' || statusLower === 'inprogress' || statusLower === 'in-progress') {
    return 'ONGOING';
  }
  
  if (statusLower === 'not started' || statusLower === 'notstarted' || statusLower === 'not-started' || statusLower === 'not completed' || statusLower === 'notcompleted') {
    return 'NOT STARTED';
  }
  
  // Default to NOT STARTED if unknown status
  return 'NOT STARTED';
};

/**
 * Parse CSV exam date with better error handling
 */
const parseExamDateFromCSV = (dateStr: string): Date | null => {
  if (!dateStr || dateStr.trim() === '') return null;
  
  console.log(`Attempting to parse exam date: "${dateStr}"`);
  
  // Try DD-MM-YYYY format (common in CSV exports)
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    try {
      const [day, month, year] = dateStr.split('-').map(n => parseInt(n, 10));
      // JavaScript months are 0-indexed
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        console.log(`Successfully parsed date: ${date.toISOString()}`);
        return date;
      }
    } catch (err) {
      console.error(`Error parsing DD-MM-YYYY date "${dateStr}":`, err);
    }
  }
  
  // Try direct Date constructor parsing
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      console.log(`Successfully parsed date with direct constructor: ${date.toISOString()}`);
      return date;
    }
  } catch (err) {
    console.error(`Error direct parsing date "${dateStr}":`, err);
  }
  
  console.error(`Failed to parse date: "${dateStr}"`);
  return null;
};

/**
 * Convert a DD-MM-YYYY string to ISO date string format that MongoDB can understand
 */
function convertToISODateString(dateStr: string): string | null {
  // Try to convert DD-MM-YYYY to YYYY-MM-DDT00:00:00.000Z
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    try {
      const [day, month, year] = dateStr.split('-').map(part => parseInt(part, 10));
      // Validate parts
      if (day > 0 && day <= 31 && month > 0 && month <= 12 && year >= 1900 && year <= 2100) {
        // Format with padding
        const formattedDay = day.toString().padStart(2, '0');
        const formattedMonth = month.toString().padStart(2, '0');
        // MongoDB compatible ISO format
        return `${year}-${formattedMonth}-${formattedDay}T00:00:00.000Z`;
      }
    } catch (err) {
      console.error(`Error converting date string: ${err}`);
    }
  }
  return null;
}

/**
 * Upload hours from CSV
 * @route POST /api/hours/upload/csv
 * @access Private
 */
export const uploadHoursCSV = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const buffer = req.file.buffer;
    const csvString = buffer.toString('utf8');
    
    // Detect delimiter - comma is default, but check for semicolon or tab
    let delimiter = ',';
    const firstLine = csvString.split('\n')[0];
    if (firstLine.includes(';') && !firstLine.includes(',')) {
      delimiter = ';';
      console.log('Detected semicolon as delimiter');
    } else if (firstLine.includes('\t') && !firstLine.includes(',')) {
      delimiter = '\t';
      console.log('Detected tab as delimiter');
    }
    
    // Parse CSV with simple splitting approach
    const parseCsvLine = (line: string): string[] => {
      // Handle quoted fields properly
      const result: string[] = [];
      let inQuotes = false;
      let currentField = '';
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          // Toggle quote state
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          // End of field
          result.push(currentField.trim());
          currentField = '';
        } else {
          // Add character to current field
          currentField += char;
        }
      }
      
      // Add the last field
      result.push(currentField.trim());
      
      return result;
    };
    
    // Parse CSV
    const rows = csvString.split('\n').filter(Boolean);
    const headers = parseCsvLine(rows[0]);
    
    console.log('CSV Headers:', headers);
    
    // Create a mapping of CSV headers to expected field names (case-insensitive)
    const headerMapping: Record<string, string> = {};
    
    // Process headers to map to expected field names
    headers.forEach((header, index) => {
      // Remove quotes if present
      const cleanHeader = header.replace(/^"(.*)"$/, '$1').trim();
      const headerLower = cleanHeader.toLowerCase();
      
      // Map common variations to expected field names
      if (headerLower === 'subject') headerMapping[index] = 'subject';
      else if (headerLower === 'batch' || headerLower === 'batch1') headerMapping[index] = 'batch';
      else if (headerLower === 'chapter' || headerLower === 'chapter name') headerMapping[index] = 'chapter';
      else if (headerLower === 'mode') headerMapping[index] = 'mode';
      else if (headerLower === 'class teacher' || headerLower === 'classteacher') headerMapping[index] = 'classTeacher';
      else if (headerLower === 'alloted hours' || headerLower === 'allotedhours') headerMapping[index] = 'allotedHours';
      else if (headerLower === 'completed hours' || headerLower === 'completedhours') headerMapping[index] = 'completedHours';
      else if (headerLower === 'remaining hours' || headerLower === 'remaininghours' || headerLower === 'remaining hours needed') headerMapping[index] = 'remainingHours';
      else if (headerLower === 'chapter status' || headerLower === 'chapterstatus') headerMapping[index] = 'chapterStatus';
      else if (headerLower === 'exam date' || headerLower === 'examdate') headerMapping[index] = 'examDate';
      // Faculty code and name mappings
      else if (headerLower === 'faculty1 code' || headerLower === 'faculty1code') headerMapping[index] = 'faculty1Code';
      else if (headerLower === 'faculty1 name' || headerLower === 'faculty1name') headerMapping[index] = 'faculty1Name';
      else if (headerLower === 'faculty2 code' || headerLower === 'faculty2code') headerMapping[index] = 'faculty2Code';
      else if (headerLower === 'faculty2 name' || headerLower === 'faculty2name') headerMapping[index] = 'faculty2Name';
      else if (headerLower === 'faculty3 code' || headerLower === 'faculty3code') headerMapping[index] = 'faculty3Code';
      else if (headerLower === 'faculty3 name' || headerLower === 'faculty3name') headerMapping[index] = 'faculty3Name';
      // Legacy faculty fields for backward compatibility
      else if (headerLower === 'faculty1') headerMapping[index] = 'faculty1';
      else if (headerLower === 'faculty2') headerMapping[index] = 'faculty2';
      else if (headerLower === 'faculty3') headerMapping[index] = 'faculty3';
      else if (headerLower === 'average mark of batch' || headerLower === 'average marks of batch') headerMapping[index] = 'averageMarksOfBatch';
      else if (headerLower === 'number of a+' || headerLower === 'number of a plus') headerMapping[index] = 'numberOfAPlus';
      else if (headerLower === 'year') headerMapping[index] = 'year';
      else if (headerLower === 'serial no' || headerLower === 'serialno' || headerLower === 'sl no' || headerLower === 'slno') headerMapping[index] = 'serialNo';
      else if (headerLower === 'remarks1') headerMapping[index] = 'remarks1';
      else if (headerLower === 'remarks2') headerMapping[index] = 'remarks2';
      else if (headerLower === 'remarks3') headerMapping[index] = 'remarks3';
      else if (headerLower === 'flag1') headerMapping[index] = 'flag1';
      else if (headerLower === 'flag2') headerMapping[index] = 'flag2';
      else if (headerLower === 'flag3') headerMapping[index] = 'flag3';
      else headerMapping[index] = headerLower.replace(/\s+/g, ''); // Remove spaces for other fields
    });
    
    console.log('Header mapping:', headerMapping);
    
    // Find the exam date column index
    const examDateIndex = headers.findIndex(header => {
      const cleanHeader = header.replace(/^"(.*)"$/, '$1').trim().toLowerCase();
      return cleanHeader === 'exam date' || cleanHeader === 'examdate';
    });
    
    console.log('Exam Date column index:', examDateIndex);
    
    // Track results
    const results = {
      total: 0,
      created: 0,
      updated: 0,
      errors: [] as string[]
    };
    
    // Get mode parameter (new, update, or both)
    const mode = req.query.mode as string || 'both';
    
    // Process each row (skip header row)
    for (let i = 1; i < rows.length; i++) {
      results.total++;
      
      try {
        const rowStr = rows[i];
        const row = parseCsvLine(rowStr);
        
        // Log raw row data for debugging
        console.log(`Row ${i} raw data:`, row);
        
        // Create an object from headers and row data using the mapping
        const hourData: Record<string, any> = {};
        row.forEach((cell, index) => {
          // Remove quotes if present
          const cleanCell = cell.replace(/^"(.*)"$/, '$1').trim();
          
          const mappedField = headerMapping[index];
          if (mappedField && cleanCell !== '') {
            hourData[mappedField] = cleanCell;
            
            // Extra logging for exam date field
            if (mappedField === 'examDate') {
              console.log(`Found exam date in column ${index}: "${cleanCell}"`);
            }
          }
        });
        
        // If we have an exam date column but no value was mapped, check directly
        if (examDateIndex >= 0 && !hourData.examDate && row[examDateIndex]) {
          const cleanCell = row[examDateIndex].replace(/^"(.*)"$/, '$1').trim();
          if (cleanCell) {
            hourData.examDate = cleanCell;
            console.log(`Directly extracted exam date from column ${examDateIndex}: "${hourData.examDate}"`);
          }
        }
        
        console.log(`Row ${i} mapped data:`, hourData);
        
        // Extract required fields
        const { batch, subject, chapter, mode: classMode, classTeacher } = hourData;
        
        if (!batch || !subject || !chapter) {
          results.errors.push(`Row ${i+1}: Missing required fields (batch, subject, or chapter)`);
          continue;
        }
        
        // Save original exam date string for later processing
        const originalExamDateString = hourData.examDate;
        
        // Create hour entry
        const hourEntry: {
          batch: any;
          subject: any;
          chapter: any;
          mode: any;
          classTeacher: any;
          allotedHours: number;
          completedHours: number;
          remainingHours: number;
          chapterStatus: any;
          createdBy: string;
          updatedBy: string;
          faculties?: Array<{ name: string; code?: string }>;
          // For now we'll omit the examDate from the initial object
          _tempExamDateString?: string;
          averageMarksOfBatch?: number;
          numberOfAPlus?: number;
          year?: string;
          remarks1?: string;
          remarks2?: string;
          remarks3?: string;
          flag1?: string;
          flag2?: string;
          flag3?: string;
        } = {
          batch: batch || '',
          subject: subject || '',
          chapter: chapter || '',
          mode: classMode || 'OFFLINE',
          classTeacher: classTeacher || '',
          allotedHours: parseFloat(hourData.allotedHours) || 0,
          completedHours: parseFloat(hourData.completedHours) || 0,
          remainingHours: parseFloat(hourData.remainingHours) || 0,
          chapterStatus: mapChapterStatus(hourData.chapterStatus),
          createdBy: req.user?.id || '',
          updatedBy: req.user?.id || ''
        };
        
        // Store the original exam date string in a temporary field
        if (originalExamDateString) {
          hourEntry._tempExamDateString = originalExamDateString;
          console.log(`Setting _tempExamDateString to "${originalExamDateString}"`);
          
          // Try to parse the date
          try {
            const examDate = parseExamDateFromCSV(originalExamDateString);
            if (examDate) {
              console.log(`Successfully parsed date: ${examDate}`);
            } else {
              console.log(`Could not parse date: ${originalExamDateString}`);
            }
          } catch (err) {
            console.error(`Error test-parsing date: ${err}`);
          }
        }
        
        if (hourData.averageMarksOfBatch) {
          hourEntry.averageMarksOfBatch = parseFloat(hourData.averageMarksOfBatch);
        }
        
        if (hourData.numberOfAPlus) {
          hourEntry.numberOfAPlus = parseInt(hourData.numberOfAPlus);
        }
        
        // Add additional fields from CSV
        if (hourData.year) hourEntry.year = hourData.year;
        if (hourData.remarks1) hourEntry.remarks1 = hourData.remarks1;
        if (hourData.remarks2) hourEntry.remarks2 = hourData.remarks2;
        if (hourData.remarks3) hourEntry.remarks3 = hourData.remarks3;
        if (hourData.flag1) hourEntry.flag1 = hourData.flag1;
        if (hourData.flag2) hourEntry.flag2 = hourData.flag2;
        if (hourData.flag3) hourEntry.flag3 = hourData.flag3;
        
        // Log the hour entry before saving
        console.log(`Hour entry to be saved for row ${i}:`, JSON.stringify(hourEntry, null, 2));
        
        // Process faculties if present
        const faculties = [];
        
        // Process faculty code and name pairs
        if (hourData.faculty1Code || hourData.faculty1Name || hourData.faculty1) {
          faculties.push({
            code: hourData.faculty1Code || '',
            name: hourData.faculty1Name || hourData.faculty1 || ''
          });
        }
        
        if (hourData.faculty2Code || hourData.faculty2Name || hourData.faculty2) {
          faculties.push({
            code: hourData.faculty2Code || '',
            name: hourData.faculty2Name || hourData.faculty2 || ''
          });
        }
        
        if (hourData.faculty3Code || hourData.faculty3Name || hourData.faculty3) {
          faculties.push({
            code: hourData.faculty3Code || '',
            name: hourData.faculty3Name || hourData.faculty3 || ''
          });
        }
        
        if (faculties.length > 0) {
          hourEntry.faculties = faculties;
        }
        
        // Check if hour entry already exists - updated to include classTeacher match
        const existingHour = await Hour.findOne({
          batch: hourEntry.batch,
          subject: hourEntry.subject,
          chapter: hourEntry.chapter,
          classTeacher: hourEntry.classTeacher
        });
        
        let savedHour: any = null;
        
        if (existingHour) {
          // Update existing entry if mode is 'update' or 'both'
          if (mode === 'update' || mode === 'both') {
            savedHour = await Hour.findByIdAndUpdate(existingHour._id, {
              ...hourEntry,
              updatedBy: req.user?.id || ''
            }, { new: true });
            results.updated++;
            
            console.log(`Updated hour entry ${existingHour._id}`);
          } else {
            results.errors.push(`Row ${i+1}: Entry already exists and mode is set to 'new' only`);
          }
        } else {
          // Create new entry if mode is 'new' or 'both'
          if (mode === 'new' || mode === 'both') {
            savedHour = await Hour.create(hourEntry);
            results.created++;
            
            console.log(`Created new hour entry ${savedHour?._id}`);
          } else {
            results.errors.push(`Row ${i+1}: Entry doesn't exist and mode is set to 'update' only`);
          }
        }
        
        // Now that we have the document saved, update the examDate as a separate step
        if (savedHour && originalExamDateString) {
          console.log(`Processing exam date for ${savedHour._id}: "${originalExamDateString}"`);
          
          try {
            // Try all date parsing methods for most reliable results
            
            // Method 1: Simple DD-MM-YYYY parsing
            if (/^\d{2}-\d{2}-\d{4}$/.test(originalExamDateString)) {
              const parts = originalExamDateString.split('-');
              const day = parseInt(parts[0], 10);
              const month = parseInt(parts[1], 10) - 1; // months are 0-indexed
              const year = parseInt(parts[2], 10);
              
              const dateObj = new Date(year, month, day);
              
              if (!isNaN(dateObj.getTime())) {
                console.log(`Updating examDate with DD-MM-YYYY format: ${dateObj.toISOString()}`);
                await Hour.updateOne(
                  { _id: savedHour._id },
                  { $set: { examDate: dateObj } }
                );
                continue; // Skip other methods if this worked
              }
            }
            
            // Method 2: Using built-in Date constructor
            const dateObj = new Date(originalExamDateString);
            if (!isNaN(dateObj.getTime())) {
              console.log(`Updating examDate with Date constructor: ${dateObj.toISOString()}`);
              await Hour.updateOne(
                { _id: savedHour._id },
                { $set: { examDate: dateObj } }
              );
              continue; // Skip other methods if this worked
            }
            
            // Method 3: Using MongoDB update pipeline
            console.log(`Trying MongoDB date parsing with update pipeline`);
            try {
              await Hour.updateOne(
                { _id: savedHour._id },
                [
                  {
                    $set: {
                      examDate: {
                        $dateFromString: {
                          dateString: originalExamDateString,
                          format: "%d-%m-%Y",
                          onError: null,
                          onNull: null
                        }
                      }
                    }
                  }
                ]
              );
              console.log(`Update pipeline completed`);
            } catch (pipelineError) {
              console.error(`Pipeline update error: ${pipelineError}`);
              
              // Method 4: Manual conversion to ISO string
              const isoDateString = convertToISODateString(originalExamDateString);
              if (isoDateString) {
                console.log(`Manually converted date to ISO: ${isoDateString}`);
                try {
                  await Hour.updateOne(
                    { _id: savedHour._id },
                    { $set: { examDate: new Date(isoDateString) } }
                  );
                  console.log(`Manual ISO date update completed`);
                } catch (isoError) {
                  console.error(`Manual ISO update error: ${isoError}`);
                }
              } else {
                // Fallback to direct Mongoose update
                try {
                  await Hour.updateOne(
                    { _id: savedHour._id },
                    { $set: { examDate: new Date(originalExamDateString) } }
                  );
                  console.log(`Fallback update completed`);
                } catch (fallbackError) {
                  console.error(`Fallback update error: ${fallbackError}`);
                }
              }
            }
          } catch (err) {
            console.error(`Error updating examDate: ${err}`);
          }
          
          // Verify the update worked by retrieving the document again
          try {
            const updatedDoc = await Hour.findById(savedHour._id);
            console.log(`Verification - examDate in saved document: ${updatedDoc?.examDate || 'null'}`);
          } catch (err) {
            console.error(`Error verifying document: ${err}`);
          }
        }
      } catch (error: any) {
        results.errors.push(`Row ${i+1}: ${error.message || 'Unknown error'}`);
        console.error(`Error processing row ${i+1}:`, error);
      }
    }
    
    // Log activity
    if (req.user) {
      await Audit.create({
        user: req.user.id,
        action: "UPLOAD",
        entityType: "HOUR",
        entityId: new mongoose.Types.ObjectId(),
        details: {
          mode,
          results: {
            total: results.total,
            created: results.created,
            updated: results.updated,
            errors: results.errors.length
          }
        },
        ipAddress: req.ip
      });
    }
    
    res.status(200).json({
      message: `Processed ${results.total} entries. Created: ${results.created}, Updated: ${results.updated}, Errors: ${results.errors.length}`,
      results
    });
  } catch (error: any) {
    console.error("Error uploading hours CSV:", error);
    res.status(500).json({ message: 'Error processing CSV file', error: error.message || 'Unknown error' });
  }
}; 