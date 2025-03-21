# Use Ubuntu 24 as the base image
FROM ubuntu:24.04

# Set environment variables
ENV DB_URL="mongodb+srv://amathur:Rwey691BQ0kFq3UL@logistics-db.qq6pf.mongodb.net/?retryWrites=true&w=majority&appName=Logistics-db"
ENV REACT_APP_SERVER_DOMIN=5000
ENV JWT_SECRET_KEY=123456789

# Install necessary dependencies and Node.js
RUN apt-get update && \
    apt-get install -y curl wget gnupg2 ca-certificates lsb-release && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs build-essential && \
    # Install libraries for Chromium (with libasound2-dev)
    apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxrandr2 \
    libxss1 \
    libasound2-dev \
    libcairo2 \
    libgtk-3-0 \
    libpango-1.0-0 \
    libxdamage1 \
    libxkbcommon0 \
    wget \
    xdg-utils && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Chromium manually
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
    dpkg -i google-chrome-stable_current_amd64.deb && \
    apt-get install -f

# Set the working directory inside the container
WORKDIR /App

# Copy only package.json and package-lock.json to leverage Docker's caching
COPY package.json package-lock.json ./

# Install dependencies with legacy peer deps
RUN npm install --legacy-peer-deps --omit=dev

# Copy the rest of the application code
COPY . .

# Expose the port your app runs on
EXPOSE 5000

# Set the environment variable for production
ENV NODE_ENV=production

# Command to start the application
CMD ["npm", "start"]
