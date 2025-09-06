# --- Build Stage ---
# Use an official Node.js image as a base. The 'alpine' version is lightweight.
FROM node:22-alpine AS builder

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the dependency definition files
COPY package*.json ./

# Install production dependencies. --omit=dev ensures packages like 'jest' are not installed.
RUN npm install --omit=dev

# --- Production Stage ---
FROM node:22-alpine

WORKDIR /usr/src/app

# Copy the already installed dependencies from the build stage
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Copy the rest of the application code
COPY . .

# Expose the port the application uses
EXPOSE 3000

# Command to start the application
CMD [ "node", "index.js" ]