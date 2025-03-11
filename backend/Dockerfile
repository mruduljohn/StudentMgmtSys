# Stage 1: Build the app
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies (alpine version)
RUN apk add --no-cache python3 make g++

# Copy only package files first (better layer caching)
COPY package*.json ./

# Install dependencies with cache mount for faster installs
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy only necessary source files
COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript files
RUN npm run build

# Stage 2: Run the app
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install only the minimal runtime dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Copy only the built files from the builder stage
COPY --from=builder /app/dist ./dist

# Install only production dependencies with cache mount
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# Create uploads directory
RUN mkdir -p dist/uploads && chmod 777 dist/uploads

# Expose the port
EXPOSE 5000

# Start the application
CMD ["node", "dist/index.js"]