import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/user.model";
import Audit from "../models/audit.model";

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        username: user.username, 
        role: user.role,
        name: user.name
      }, 
      process.env.JWT_SECRET || "secret", 
      { expiresIn: "24h" }
    );

    // Log login activity
    await Audit.create({
      user: user._id,
      action: "LOGIN",
      entityType: "SYSTEM",
      details: { username: user.username },
      ipAddress: req.ip
    });

    res.json({ 
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, name, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      res.status(400).json({ 
        message: "User already exists with this username or email" 
      });
      return;
    }

    // Only ADMIN can create other ADMIN users
    if (role === "ADMIN" && req.user?.role !== "ADMIN") {
      res.status(403).json({ 
        message: "Only administrators can create admin accounts" 
      });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      name,
      role
    });

    // Log user creation
    await Audit.create({
      user: req.user?.id || newUser._id,
      action: "CREATE",
      entityType: "USER",
      entityId: newUser._id,
      details: { username, email, role },
      ipAddress: req.ip
    });

    res.status(201).json({ 
      message: "User registered successfully",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select("-password");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json(user);
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const logoutUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Log logout activity
    if (req.user?.id) {
      await Audit.create({
        user: req.user.id,
        action: "LOGOUT",
        entityType: "SYSTEM",
        details: { username: req.user.username },
        ipAddress: req.ip
      });
    }
    
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
