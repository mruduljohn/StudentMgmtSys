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
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name username')
      .populate('updatedBy', 'name username');
    
    res.json({
      hours,
      pagination: {
        total: totalHours,
        page,
        pages: Math.ceil(totalHours / limit)
      }
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
      if (hour.classTeacher.toLowerCase() !== mentorName.toLowerCase() && 
          hour.classTeacher.toLowerCase() !== mentorUsername.toLowerCase()) {
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
    
    const hour = new Hour(hourData);
    await hour.save();
    
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
      if (hour.classTeacher.toLowerCase() !== mentorName.toLowerCase() && 
          hour.classTeacher.toLowerCase() !== mentorUsername.toLowerCase()) {
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
      updateData.classTeacher = hour.classTeacher;
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
      if (hour.classTeacher.toLowerCase() !== mentorName.toLowerCase() && 
          hour.classTeacher.toLowerCase() !== mentorUsername.toLowerCase()) {
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
      const progress = chapter.allotedHours > 0 
        ? Math.round((chapter.completedHours / chapter.allotedHours) * 100) 
        : 0;
      
      return {
        chapter: chapter.chapter,
        status: chapter.chapterStatus,
        progress: progress > 100 ? 100 : progress,
        totalHours: chapter.completedHours,
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