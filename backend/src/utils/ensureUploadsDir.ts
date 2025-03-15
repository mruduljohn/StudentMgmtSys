import fs from "fs";
import path from "path";

/**
 * Ensures that the uploads directory exists
 * Creates it if it doesn't exist
 */
export const ensureUploadsDir = (): void => {
  const uploadsDir = path.join(process.cwd(), "src", "uploads");
  
  // Also ensure the dist/uploads directory exists for production
  const distUploadsDir = path.join(process.cwd(), "dist", "uploads");
  
  try {
    if (!fs.existsSync(uploadsDir)) {
      console.log(`Creating uploads directory: ${uploadsDir}`);
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    if (!fs.existsSync(distUploadsDir)) {
      console.log(`Creating dist/uploads directory: ${distUploadsDir}`);
      fs.mkdirSync(distUploadsDir, { recursive: true });
    }
  } catch (error) {
    console.error('Error creating uploads directory:', error);
  }
};

export default ensureUploadsDir; 