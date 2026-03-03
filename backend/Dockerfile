# Use official Node.js LTS image
FROM node:22.14.0-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source code
COPY . .

# # TODO: REMOVE BEFORE PUSHING TO DOCKERHUB - Environment variables for testing only
# # host.docker.internal is a special DNS name that resolves to the internal IP address of the host machine and needs to be changed before pushing to dokerhub
# ENV MONGO_URI=mongodb://host.docker.internal:27017/
# ENV PORT=8000
# ENV FRONTEND_URL=http://localhost:5173

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose the port the app runs on
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8000/metro', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["npm", "run", "dev"]