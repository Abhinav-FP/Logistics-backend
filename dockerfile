# Use a lightweight Node.js base image
FROM node:16-alpine

# Set the working directory inside the container
WORKDIR /App

# Copy only package.json and package-lock.json to leverage Docker's caching
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the port your app runs on
EXPOSE 5000

# Set the environment variable for production
ENV NODE_ENV=production

# Command to start the application
CMD ["npm", "start"]
