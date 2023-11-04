# Use the official Node.js 14 image as the base image
FROM node:14

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY . .

# Expose the port your Node.js app is listening on (if applicable)
# EXPOSE 8080

# Start the Node.js app when the container is run
CMD ["npm", "start"]