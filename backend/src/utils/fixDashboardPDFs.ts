/**
 * This script fixes the dashboardPDFs field in the Config collection.
 * It ensures that the dashboard-pdfs document has the dashboardPDFs field
 * even if it was created with the wrong schema initially.
 */

import mongoose from 'mongoose';
import Config from '../models/config.model';
import { config } from 'dotenv';

// Load environment variables
config();

async function fixDashboardPDFs() {
  try {
    console.log('Starting dashboardPDFs fix script...');
    
    // Connect to MongoDB
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/studentmgmt';
    console.log(`Connecting to MongoDB at ${MONGO_URI}`);
    
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Find the existing dashboard-pdfs document
    const existingDoc = await Config.findOne({ category: 'dashboard-pdfs' });
    console.log('Existing document:', existingDoc);
    
    if (existingDoc) {
      console.log('Fixing existing document...');
      
      // Check if dashboardPDFs exists
      if (!existingDoc.dashboardPDFs || !Array.isArray(existingDoc.dashboardPDFs)) {
        console.log('dashboardPDFs field missing or not an array, adding it...');
        
        // Add dashboardPDFs field directly to the document
        await Config.updateOne(
          { category: 'dashboard-pdfs' },
          { 
            $set: { 
              dashboardPDFs: [] 
            }
          }
        );
        
        console.log('Document updated with empty dashboardPDFs array');
      } else {
        console.log('dashboardPDFs field already exists with', existingDoc.dashboardPDFs.length, 'items');
      }
      
      // Verify the update
      const updatedDoc = await Config.findOne({ category: 'dashboard-pdfs' });
      console.log('Updated document:', updatedDoc);
    } else {
      console.log('No dashboard-pdfs document found, creating one...');
      
      // Create a new document with dashboardPDFs field
      const newDoc = await Config.create({
        category: 'dashboard-pdfs',
        values: [],
        dashboardPDFs: []
      });
      
      console.log('Created new document:', newDoc);
    }
    
    console.log('Script completed successfully');
  } catch (error) {
    console.error('Error in fix script:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Auto-execute if this script is run directly
if (require.main === module) {
  fixDashboardPDFs()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Script error:', err);
      process.exit(1);
    });
}

export default fixDashboardPDFs; 