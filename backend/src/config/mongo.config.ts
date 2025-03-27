import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/studentdb";

export const connectDB = async () => {
  try {
    // Connect with specific options to handle standalone MongoDB server
    await mongoose.connect(mongoURI, {
      // This flag helps avoid some transaction-related issues with non-replica set MongoDB
      autoIndex: true,
      // Add a warning when transactions are attempted on standalone MongoDB
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log("✅ MongoDB Connected Successfully");
    
    // Detect if we're running on a replica set
    const isReplSet = await checkIfReplicaSet();
    if (!isReplSet) {
      console.log("⚠️ MongoDB is running in standalone mode - transactions are not supported");
    }
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  }
};

// Check if MongoDB is running as a replica set
const checkIfReplicaSet = async (): Promise<boolean> => {
  try {
    if (!mongoose.connection.db) {
      console.error("MongoDB connection not initialized");
      return false;
    }
    
    const admin = mongoose.connection.db.admin();
    const status = await admin.serverStatus();
    return status.repl !== undefined;
  } catch (error) {
    console.error("Error checking replica set status:", error);
    return false;
  }
};
