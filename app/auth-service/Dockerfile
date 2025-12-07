# ---- Base image ----
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy application source
COPY . .

# Expose app port
EXPOSE 4000

# Set production environment
ENV NODE_ENV=production

# Run the app
CMD ["node", "src/server.js"]