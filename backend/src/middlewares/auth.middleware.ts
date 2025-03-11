import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User from "../models/user.model";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        role: string;
        name: string;
      };
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as {
      id: string;
      username: string;
      role: string;
      name: string;
    };

    // Check if user still exists
    const userExists = await User.exists({ _id: decoded.id });
    if (!userExists) {
      res.status(401).json({ message: "User no longer exists" });
      return;
    }

    // Add user info to request
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
    return;
  }
};

// Middleware to check if user is an admin
export const adminOnly = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "ADMIN") {
    res.status(403).json({ message: "Access denied. Admin only." });
    return;
  }
  next();
};

// Middleware to check if user is a mentor or admin
export const mentorOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "ADMIN" && req.user?.role !== "MENTOR") {
    res.status(403).json({ message: "Access denied. Mentor or Admin only." });
    return;
  }
  next();
};
