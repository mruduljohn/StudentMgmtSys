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
        role: user.role,
        class: user.class
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, name, role, class: assignedClass } = req.body;

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
      role,
      class: role === "MENTOR" ? assignedClass : undefined
    });

    // Log user creation
    await Audit.create({
      user: req.user?.id || newUser._id,
      action: "CREATE",
      entityType: "USER",
      entityId: newUser._id,
      details: { username, email, role, class: assignedClass },
      ipAddress: req.ip
    });

    res.status(201).json({ 
      message: "User registered successfully",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        class: newUser.class
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all users (Admin only)
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only ADMIN can view all users
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({ message: "Access denied. Admin only." });
      return;
    }

    // Get all users, excluding password field
    const users = await User.find({}, { password: 0 });

    // Format the users to include the id field properly
    const formattedUsers = users.map(user => ({
      id: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      class: user.class
    }));

    res.json({ users: formattedUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user (Admin only)
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    const { name, email, role, class: assignedClass } = req.body;

    // Only ADMIN can update users
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({ message: "Access denied. Admin only." });
      return;
    }

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Update user fields
    user.name = name || user.name;
    user.email = email || user.email;
    
    // Only update role if provided
    if (role) {
      user.role = role;
    }

    // Update class if user is a MENTOR
    if (role === "MENTOR" || user.role === "MENTOR") {
      user.class = assignedClass || user.class;
    } else {
      // Clear class when role is ADMIN
      user.class = undefined;
    }

    // Save updated user
    await user.save();

    // Log user update
    await Audit.create({
      user: req.user?.id,
      action: "UPDATE",
      entityType: "USER",
      entityId: user._id,
      details: { username: user.username, role: user.role },
      ipAddress: req.ip
    });

    // Return updated user without password
    const updatedUser = await User.findById(userId, { password: 0 });
    res.json({ 
      message: "User updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete user (Admin only)
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;

    // Only ADMIN can delete users
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({ message: "Access denied. Admin only." });
      return;
    }

    // Prevent deleting yourself
    if (userId === req.user?.id) {
      res.status(400).json({ message: "Cannot delete your own account" });
      return;
    }

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Delete user
    await User.findByIdAndDelete(userId);

    // Log user deletion
    await Audit.create({
      user: req.user?.id,
      action: "DELETE",
      entityType: "USER",
      entityId: user._id,
      details: { username: user.username, role: user.role },
      ipAddress: req.ip
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
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
    
    // Format the response to include all necessary fields
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      class: user.class
    });
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

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    const { currentPassword, newPassword } = req.body;
    
    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    
    // If resetting own password, verify current password
    if (req.user?.id === userId) {
      if (!currentPassword) {
        res.status(400).json({ message: "Current password is required" });
        return;
      }
      
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ message: "Current password is incorrect" });
        return;
      }
    } else {
      // Only ADMIN can reset other users' passwords
      if (req.user?.role !== "ADMIN") {
        res.status(403).json({ message: "Only administrators can reset other users' passwords" });
        return;
      }
      
      // If resetting another admin's password, current password is required for verification
      if (user.role === "ADMIN" && !currentPassword) {
        res.status(400).json({ message: "Your current password is required to reset another admin's password" });
        return;
      }
      
      if (user.role === "ADMIN" && currentPassword) {
        // Verify admin's password
        const adminUser = await User.findById(req.user.id);
        if (!adminUser) {
          res.status(404).json({ message: "Admin user not found" });
          return;
        }
        
        const isAdminPasswordValid = await bcrypt.compare(currentPassword, adminUser.password);
        if (!isAdminPasswordValid) {
          res.status(401).json({ message: "Your current password is incorrect" });
          return;
        }
      }
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update user's password
    user.password = hashedPassword;
    await user.save();
    
    // Log password reset
    await Audit.create({
      user: req.user?.id,
      action: "RESET_PASSWORD",
      entityType: "USER",
      entityId: user._id,
      details: { 
        username: user.username,
        resetByAdmin: req.user?.id !== userId
      },
      ipAddress: req.ip
    });
    
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Server error" });
  }
};
