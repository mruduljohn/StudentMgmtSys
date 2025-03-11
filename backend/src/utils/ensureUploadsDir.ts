import fs from "fs";
import path from "path";

/**
 * Ensures that the uploads directory exists
 */
export function ensureUploadsDir(): void {
  const uploadsDir = path.join(__dirname, "..", "uploads");
  
  if (!fs.existsSync(uploadsDir)) {
    console.log("Creating uploads directory:", uploadsDir);
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

export default ensureUploadsDir; 