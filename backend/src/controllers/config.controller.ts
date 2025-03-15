import { Request, Response } from "express";
import Config from "../models/config.model";
import Audit from "../models/audit.model";
import mongoose from "mongoose";

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

// Get subject chapters configuration
export const getSubjectChapters = async (req: Request, res: Response): Promise<void> => {
  try {
    let config = await Config.findOne({ category: 'subjectChapters' });
    
    if (!config) {
      // If subject chapters don't exist, create with empty chapters
      config = new Config({
        category: 'subjectChapters',
        values: ['PHYSICS', 'CHEMISTRY', 'BOTANY', 'ZOOLOGY', 'MATHS'],
        subjectChapters: new Map(),
        lastUpdatedBy: req.user ? new mongoose.Types.ObjectId(req.user.id) : undefined
      });
      
      await config.save();
      
      // Log configuration creation
      if (req.user) {
        await Audit.create({
          user: new mongoose.Types.ObjectId(req.user.id),
          action: "CONFIG_CHANGE",
          entityType: "CONFIG",
          entityId: config._id,
          details: { category: 'subjectChapters', action: 'created' },
          ipAddress: req.ip
        });
      }
    }
    
    // Convert Map to a more JSON-friendly format
    const chapters = config.subjectChapters ? Object.fromEntries(config.subjectChapters) : {};
    
    res.json(chapters);
  } catch (error) {
    console.error("Error fetching subject chapters:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update subject chapters for a specific subject
export const updateSubjectChapters = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subject } = req.params;
    const { chapters } = req.body;
    
    // Only ADMIN can update configurations
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({ message: "Only administrators can update configurations" });
      return;
    }
    
    // Find the subjectChapters config
    let config = await Config.findOne({ category: 'subjectChapters' });
    
    if (!config) {
      // Create if it doesn't exist
      config = new Config({
        category: 'subjectChapters',
        values: ['PHYSICS', 'CHEMISTRY', 'BOTANY', 'ZOOLOGY', 'MATHS'],
        subjectChapters: new Map(),
        lastUpdatedBy: new mongoose.Types.ObjectId(req.user.id)
      });
    }
    
    // Update the chapters for the specified subject
    config.subjectChapters.set(subject, chapters);
    
    // Save the updated config
    await config.save();
    
    // Log configuration update
    await Audit.create({
      user: new mongoose.Types.ObjectId(req.user.id),
      action: "CONFIG_CHANGE",
      entityType: "CONFIG",
      entityId: config._id,
      details: { category: 'subjectChapters', subject, chapters },
      ipAddress: req.ip
    });
    
    res.json({ 
      message: `Chapters for ${subject} updated successfully`,
      subject,
      chapters
    });
  } catch (error) {
    console.error("Error updating subject chapters:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Initialize default subject chapters
export const initializeDefaultSubjectChapters = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only ADMIN can initialize configurations
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({ message: "Only administrators can initialize configurations" });
      return;
    }
    
    const defaultChapters = {
      'PHYSICS': [
        'Physical World, Units and Measurements',
        'Motion in a Straight Line',
        'Motion in a Plane',
        'Laws of Motion',
        'Work Energy & Power',
        'System of Particles and Rigid Body Rotation',
        'Gravitation',
        'Mechanical Properties of Solids & Fluids',
        'Thermal Properties of Matter, Thermodynamics and Kinetic Theory',
        'Oscillations',
        'Waves',
        'Electrostatics',
        'Current Electricity',
        'Moving Charges and Magnetism',
        'Magnetism and Matter',
        'Electromagnetic Induction and Alternating Current',
        'Electromagnetic Waves',
        'Ray Optics & Optical Instruments',
        'Wave Optics',
        'Dual Nature of Matter and Radiation',
        'Atoms and Nuclei',
        'Semiconductor Electronics'
      ],
      'CHEMISTRY': [
        'Some Basic Concepts of Chemistry',
        'Structure of Atoms',
        'Classification of Elements and Periodicity in Properties',
        'Chemical Bonding and Molecular Structure',
        'Redox Reaction',
        'Thermodynamics and Chemical Energetics',
        'Chemical and Ionic Equilibrium',
        'The p Block Elements',
        'Organic Chemistry–Some Basic Principles–Part I (Nomenclature)',
        'Organic Chemistry–Some Basic Principles–Part II (Reaction Mechanism)',
        'Organic Chemistry–Some Basic Principles–Part III (Purification)',
        'Hydrocarbons',
        'Solutions',
        'Electrochemistry',
        'Chemical Kinetics',
        'The d and f Block Elements',
        'Coordination Compounds and Organometallics',
        'Halo Alkanes and Halo Arenes',
        'Alcohols, Phenols and Ethers',
        'Aldehydes and Ketones',
        'Carboxylic Acids and Its Derivatives',
        'Amines',
        'Biomolecules',
        'Practical Chemistry'
      ],
      'BOTANY': [
        'Biological Classification',
        'Plant Kingdom',
        'Morphology of Flowering Plants',
        'Anatomy of Flowering Plants',
        'Cell : The unit of life',
        'Cell Cycle and Cell Division',
        'Photosynthesis in Higher Plants',
        'Respiration in Plants',
        'Plant Growth and Development',
        'Sexual reproduction in Flowering Plants',
        'Biotechnology : Principles and processes',
        'Biotechnology and its Applications',
        'Organism and Population',
        'Ecosystem'
      ],
      'ZOOLOGY': [
        'The Living World',
        'Animal Kingdom Non Chordata',
        'Animal Kingdom Phylum Chordata',
        'Structural organisation in Animals Animal Tissue',
        'Structural organisation in Animals Morphology of Animals',
        'Biomolecules',
        'Breathing and Exchange of Gases',
        'Body Fluids and Circulation',
        'Excretory Products and Their Elimination',
        'Locomotion and Movement',
        'Neural Control and Coordination',
        'Chemical Coordination and Integration',
        'Human Reproduction',
        'Reproductive Health',
        'Principles of Inheritance and Variation',
        'Molecular Basis of Inheritance',
        'Evolution',
        'Human Health and Disease',
        'Microbes in Human Welfare',
        'Biodiversity and Conservation'
      ],
      'MATHS': [
        'Sets, Relations and Functions',
        'Trigonometry I',
        'Linear Inequations and Inequalities',
        'Quadratic Equation',
        'Complex Numbers',
        'Permutation, Combination and Binomial Theorem',
        'Sequences and Series',
        'Straight Lines',
        'Circles',
        'Conic Section',
        'Statistics',
        'Trigonometry II',
        'Matrices and Determinants',
        'Limits of Real Functions',
        'Continuity, Differentiability and Derivatives',
        'Applications of Differentiation',
        'Integration and its Applications',
        'Differential Equations',
        'Vectors',
        'Three Dimensional Geometry',
        'Theory of Probability',
        'Linear Programming',
        'Logarithm'
      ]
    };
    
    // Find or create the subjectChapters config
    let config = await Config.findOne({ category: 'subjectChapters' });
    
    if (!config) {
      config = new Config({
        category: 'subjectChapters',
        values: Object.keys(defaultChapters),
        subjectChapters: new Map(),
        lastUpdatedBy: new mongoose.Types.ObjectId(req.user.id)
      });
    } else {
      // Update the values array with all subject keys
      config.values = Object.keys(defaultChapters);
      config.lastUpdatedBy = new mongoose.Types.ObjectId(req.user.id);
    }
    
    // Update with default chapters
    for (const [subject, chapters] of Object.entries(defaultChapters)) {
      config.subjectChapters.set(subject, chapters);
    }
    
    // Save the config
    await config.save();
    
    // Log configuration update
    await Audit.create({
      user: new mongoose.Types.ObjectId(req.user.id),
      action: "CONFIG_CHANGE",
      entityType: "CONFIG",
      entityId: config._id,
      details: { category: 'subjectChapters', subjects: Object.keys(defaultChapters) },
      ipAddress: req.ip
    });
    
    res.json({
      message: "Default subject chapters initialized successfully",
      subjects: Object.keys(defaultChapters)
    });
  } catch (error) {
    console.error("Error initializing subject chapters:", error);
    res.status(500).json({ message: "Server error" });
  }
}; 