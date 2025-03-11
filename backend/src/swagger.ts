import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import path from "path";

const options: swaggerJsDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Student Management System API",
      version: "1.0.0",
      description: "API Documentation for Student Management System",
    },
    servers: [
      {
        url: "http://localhost:5000/api",
      },
    ],
  },
  apis: [path.join(__dirname, "./routes/*.js")], // Now converting TypeScript to JS path
};

const swaggerSpec = swaggerJsDoc(options);

export const setupSwagger = (app: Express) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
