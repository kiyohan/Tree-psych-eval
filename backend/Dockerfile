# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and install dependencies
# This is done so we don't have to run npm install every time we start
COPY package*.json ./
RUN npm install --no-warnings

# The command will be provided by docker-compose
CMD [ "npm", "run", "dev" ]