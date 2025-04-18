/**
 * Custom API Error class that extends the built-in Error class
 * Used for throwing structured API errors with status codes
 */
class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    // Capture the stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError; 