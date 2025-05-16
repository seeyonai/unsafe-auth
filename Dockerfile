# FROM node:18-alpine
FROM seeyonai-registry.cn-shanghai.cr.aliyuncs.com/library/node:22-alpine AS base

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose the port (assuming a standard port, update as needed)
EXPOSE 4423

# Start the application
CMD ["npm", "start"]