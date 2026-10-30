# Use Node.js 22 slim image as the base
FROM node:22-slim

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker layer caching
COPY package*.json ./

# Install all dependencies required for the build process
RUN npm install

# Copy the rest of the application files
COPY . .

# Run the build script to compile the frontend and the backend server into /dist
RUN npm run build

# Expose port 3000 as required by the platform configuration
EXPOSE 3000

# Start the compiled production server
CMD ["npm", "start"]
