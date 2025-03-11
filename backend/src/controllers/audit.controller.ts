import { Request, Response } from "express";
import Audit from "../models/audit.model";

// Get audit logs with pagination and filtering
export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only ADMIN can view all audit logs
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({ message: "Only administrators can view audit logs" });
      return;
    }
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    // Build filter object from query params
    const filter: any = {};
    
    // Filter by action type
    if (req.query.action) {
      filter.action = req.query.action;
    }
    
    // Filter by entity type
    if (req.query.entityType) {
      filter.entityType = req.query.entityType;
    }
    
    // Filter by user
    if (req.query.userId) {
      filter.user = req.query.userId;
    }
    
    // Filter by date range
    if (req.query.startDate) {
      filter.createdAt = { $gte: new Date(req.query.startDate as string) };
    }
    if (req.query.endDate) {
      const endDate = new Date(req.query.endDate as string);
      endDate.setHours(23, 59, 59, 999); // End of day
      filter.createdAt = { 
        ...filter.createdAt, 
        $lte: endDate 
      };
    }
    
    // Count total documents for pagination
    const total = await Audit.countDocuments(filter);
    
    // Get audit logs with pagination and populate user info
    const auditLogs = await Audit.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username name role");
    
    res.json({
      auditLogs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get audit logs for a specific student
export const getStudentAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    
    // Build filter
    const filter: any = {
      entityType: "STUDENT",
      entityId: studentId
    };
    
    // Get audit logs
    const auditLogs = await Audit.find(filter)
      .sort({ createdAt: -1 })
      .populate("user", "username name role");
    
    res.json(auditLogs);
  } catch (error) {
    console.error("Error fetching student audit logs:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get audit logs for current user
export const getUserAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    // Get audit logs
    const auditLogs = await Audit.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json(auditLogs);
  } catch (error) {
    console.error("Error fetching user audit logs:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get audit log statistics
export const getAuditStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only ADMIN can view audit statistics
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({ message: "Only administrators can view audit statistics" });
      return;
    }
    
    // Get counts by action type
    const actionStats = await Audit.aggregate([
      { $group: { _id: "$action", count: { $sum: 1 } } }
    ]);
    
    // Get counts by entity type
    const entityStats = await Audit.aggregate([
      { $group: { _id: "$entityType", count: { $sum: 1 } } }
    ]);
    
    // Get top users by activity
    const userStats = await Audit.aggregate([
      { $group: { _id: "$user", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { 
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      {
        $project: {
          _id: 1,
          count: 1,
          username: { $arrayElemAt: ["$userInfo.username", 0] },
          name: { $arrayElemAt: ["$userInfo.name", 0] },
          role: { $arrayElemAt: ["$userInfo.role", 0] }
        }
      }
    ]);
    
    // Get activity over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const timeStats = await Audit.aggregate([
      { 
        $match: { 
          createdAt: { $gte: thirtyDaysAgo } 
        } 
      },
      {
        $group: {
          _id: { 
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } 
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      actionStats,
      entityStats,
      userStats,
      timeStats
    });
  } catch (error) {
    console.error("Error fetching audit stats:", error);
    res.status(500).json({ message: "Server error" });
  }
}; 