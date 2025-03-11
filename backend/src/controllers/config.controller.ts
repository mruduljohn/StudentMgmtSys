import { Request, Response } from "express";
import Config from "../models/config.model";
import Audit from "../models/audit.model";

// Get all configuration categories
export const getAllConfigs = async (req: Request, res: Response): Promise<void> => {
  try {
    const configs = await Config.find().sort({ category: 1 });
    res.json(configs);
  } catch (error) {
    console.error("Error fetching configs:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get configuration by category
export const getConfigByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.params;
    const config = await Config.findOne({ category });
    
    if (!config) {
      res.status(404).json({ message: "Configuration category not found" });
      return;
    }
    
    res.json(config);
  } catch (error) {
    console.error("Error fetching config:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update configuration values
export const updateConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.params;
    const { values } = req.body;
    
    // Only ADMIN can update configurations
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({ message: "Only administrators can update configurations" });
      return;
    }
    
    // Find and update or create if not exists
    const config = await Config.findOneAndUpdate(
      { category },
      { 
        values,
        lastUpdatedBy: req.user.id
      },
      { new: true, upsert: true }
    );
    
    // Log configuration update
    await Audit.create({
      user: req.user.id,
      action: "CONFIG_CHANGE",
      entityType: "CONFIG",
      entityId: config._id,
      details: { category, values },
      ipAddress: req.ip
    });
    
    res.json(config);
  } catch (error) {
    console.error("Error updating config:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Initialize default configurations
export const initializeDefaultConfigs = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only ADMIN can initialize configurations
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({ message: "Only administrators can initialize configurations" });
      return;
    }
    
    const defaultConfigs = [
      {
        category: "batches",
        values: ["25TSRFIX", "26TSRFIX", "27TSRFIX"]
      },
      {
        category: "classTeachers",
        values: ["DEEPA.MD.(WB)", "JOHN.D", "MARY.S"]
      },
      {
        category: "hostels",
        values: ["DS", "BOYS HOSTEL", "GIRLS HOSTEL"]
      },
      {
        category: "streams",
        values: ["FOUNDATION", "MEDICAL", "ENGINEERING"]
      },
      {
        category: "programs",
        values: ["FOUNDATION", "NEET", "JEE"]
      },
      {
        category: "studyMaterials",
        values: ["NOT RECEIVED", "RECEIVED", "PARTIALLY RECEIVED"]
      },
      {
        category: "uniforms",
        values: ["NOT RECEIVED", "RECEIVED", "PARTIALLY RECEIVED"]
      },
      {
        category: "idCards",
        values: ["NOT RECEIVED", "RECEIVED"]
      },
      {
        category: "tabs",
        values: ["REQUESTED NOT PAID", "RECEIVED PAID", "RECEIVED NOT PAID", "REQUESTED PAID", "PERSONAL TAB", "NOT REQUIRED"]
      },
      {
        category: "joinedStatuses",
        values: ["ALLOTED", "DISCONTINUED", "JOINED", "NOT JOINING", "CENTRE CHANGE"]
      },
      {
        category: "syllabuses",
        values: ["STATE", "CBSE", "ICSE", "OTHER"]
      }
    ];
    
    // Create or update each config
    const results = [];
    for (const config of defaultConfigs) {
      const result = await Config.findOneAndUpdate(
        { category: config.category },
        { 
          ...config,
          lastUpdatedBy: req.user.id
        },
        { new: true, upsert: true }
      );
      
      results.push(result);
      
      // Log configuration update
      await Audit.create({
        user: req.user.id,
        action: "CONFIG_CHANGE",
        entityType: "CONFIG",
        entityId: result._id,
        details: { category: config.category, values: config.values },
        ipAddress: req.ip
      });
    }
    
    res.json({
      message: "Default configurations initialized successfully",
      configs: results
    });
  } catch (error) {
    console.error("Error initializing configs:", error);
    res.status(500).json({ message: "Server error" });
  }
}; 