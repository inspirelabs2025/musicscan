FROM node:20-alpine

# Install ffmpeg
RUN apk add --no-cache ffmpeg

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Run as non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S worker -u 1001
USER worker

# Start the worker
CMD ["npm", "start"]
