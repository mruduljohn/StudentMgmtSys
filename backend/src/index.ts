import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/mongo.config";
import authRoutes from "./routes/auth.routes";
import studentRoutes from "./routes/student.routes";
import configRoutes from "./routes/config.routes";
import auditRoutes from "./routes/audit.routes";
import hourRoutes from "./routes/hour.routes";
import { setupSwagger } from "./swagger";
import { ensureUploadsDir } from "./utils/ensureUploadsDir";

// Load environment variables
dotenv.config();

// Ensure uploads directory exists
ensureUploadsDir();

// Initialize Express app
const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000' || '*';
const corsOptions = {
  origin: corsOrigin === '*' ? true : corsOrigin, // Allow any origin if set to '*'
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());

// Swagger API Documentation
setupSwagger(app);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api", studentRoutes);
app.use("/api", configRoutes);
app.use("/api", auditRoutes);
app.use("/api", hourRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: err.message || "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err : {}
  });
});

// Start Server
app.listen(PORT, '0.0.0.0', async () => {
  await connectDB();
  console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
  console.log(`📚 API Documentation available at http://0.0.0.0:${PORT}/api-docs`);
});
