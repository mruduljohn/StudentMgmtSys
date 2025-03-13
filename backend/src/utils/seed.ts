import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/mongo.config";
import User from "../models/user.model";
import Config from "../models/config.model";

// Load environment variables
dotenv.config();

// Function to seed admin user
async function seedAdminUser() {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ username: "admin" });
    
    if (adminExists) {
      console.log("Admin user already exists, skipping...");
      return;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);
    
    // Create admin user
    const admin = await User.create({
      username: "admin",
      email: "admin@example.com",
      password: hashedPassword,
      name: "Administrator",
      role: "ADMIN"
    });
    
    console.log("Admin user created successfully:", admin.username);
    return admin;
  } catch (error) {
    console.error("Error seeding admin user:", error);
    throw error;
  }
}

// Function to seed default configurations
async function seedDefaultConfigs(adminId: mongoose.Types.ObjectId) {
  try {
    // Default configurations
    const defaultConfigs = [
      {
        category: "batches",
        values: ['25HTSE', '25HTSM', '25STE1(Bh)', '25STE2(Nm)', '25STM1(Bh)', '25STM2(Nm)', 
    '25TRE1(State)', '25TRE2(CBSE)', '25TRM1', '25TSRFIX', '25TSRFVI', '25TSRFVII', 
    '25TSRFVIII', '25TSRFX', '26BTE1(Bh)', '26BTM1(Bh)', '26ETSA1', '26ETSI1', 
    '26HTSA1', '26HTSI1', '26TRE11', '26TRM11', '26TSRA3', '26TSRA4', '26TSRI3', 
    '26TSRI4', 'K1', 'K10', 'K11', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8RR', 
    'K9RR', 'KE1', 'KE2', 'KE3', 'NEW R', 'NEW RR', 'ONLINE']
      },
      {
        category: "classTeachers",
        values: ['DEEPA.MD.(WB)', 'ARCHANA', 'JEEVAN.JOSHY', 'KEERTHY.E.(WB)', 'NIMYA.GIRIJAN.(WB)', 
    'SRUTHI.(WB)', 'SANDRA.(WB)', 'ATHIRA.(WB)', 'ARYA.R', 'LIMSY.PAULSON.(WB)', 
    'STENIYA.LIEONS.(WB)', 'SHINI.T.S.(WB)', 'CHAITRA', 'ANJU.K', 'MEGHA.MUKUNDAN', 
    'NOT ASSIGNED', 'ALBIN.VARGHESE', 'RAJESWARY.VISWANATHAN', 'SWATHY', 'SRUTHI.P', 
    'JOYAL.P.JOSE', 'HARIKRISHNAN.R', 'ARPITHA.SHAJAN', 'SANJANA', 'NELSON', 
    'VISWAM.MURALI', 'MANJIMA.JIMMY', 'ANOOP.MOHAN', 'VISAKHAN', 'ANJALI.K.DAS.(WB)', 
    'ANANDALAKSHMI', 'JISHNA', 'DONA.MERIN.JOSE', 'RADHIKA.ANILKUMAR', 'SREELAKSHMI.P']
      },
      {
        category: "hostels",
        values: ['DS', 'ST.ANNS', 'MARIGOLD GRAND', 'HOSTEL REQUIRED', 'ST.JOHNS', 
    'THE GUARDIAN', 'NEST GRAND', 'LAVERNA', 'B MADONA', 'B MARTHOMA', 'B ST.MARYS', 
    'PETER CLAVER', 'LITTLE FLOWER', 'ST.AUGUSTINE', 'SDV']
      },
      {
        category: "streams",
        values: ['FOUNDATION', 'ENGINEERING', 'MEDICAL']
      },
      {
        category: "programs",
        values: ['FOUNDATION', 'EVENING', 'SPECIAL', 'SUPER', 'HYBRID', 'REPEATER', 'REGULAR']
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
    for (const config of defaultConfigs) {
      await Config.findOneAndUpdate(
        { category: config.category },
        { 
          ...config,
          lastUpdatedBy: adminId
        },
        { upsert: true }
      );
      
      console.log(`Config '${config.category}' created/updated successfully`);
    }
    
    console.log("Default configurations seeded successfully");
  } catch (error) {
    console.error("Error seeding default configs:", error);
    throw error;
  }
}

// Function to seed demo mentors
async function seedDemoMentors() {
  try {
    // Check if demo mentors already exist
    const mentorExists = await User.findOne({ username: "mentor1" });
    
    if (mentorExists) {
      console.log("Demo mentors already exist, skipping...");
      return;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("mentor123", salt);
    
    // Create demo mentors
    const mentors = [
      {
        username: "mentor1",
        email: "mentor1@example.com",
        password: hashedPassword,
        name: "DEEPA.MD.(WB)",
        role: "MENTOR"
      },
      {
        username: "mentor2",
        email: "mentor2@example.com",
        password: hashedPassword,
        name: "JOHN.D",
        role: "MENTOR"
      },
      {
        username: "mentor3",
        email: "mentor3@example.com",
        password: hashedPassword,
        name: "MARY.S",
        role: "MENTOR"
      }
    ];
    
    for (const mentorData of mentors) {
      const mentor = await User.create(mentorData);
      console.log(`Mentor user created successfully: ${mentor.username} (${mentor.name})`);
    }
  } catch (error) {
    console.error("Error seeding demo mentors:", error);
    throw error;
  }
}

// Main seed function
async function seed() {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Seed admin user
    const admin = await seedAdminUser();
    
    // Seed default configurations
    if (admin) {
      await seedDefaultConfigs(admin._id);
    }
    
    // Seed demo mentors
    await seedDemoMentors();
    
    console.log("Database seeding completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the seed function
seed(); 