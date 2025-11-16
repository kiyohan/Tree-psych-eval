# Use the official Node.js image
FROM node:18-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --no-warnings

# The command to start the dev server will be provided by docker-compose
CMD ["npm", "start"]