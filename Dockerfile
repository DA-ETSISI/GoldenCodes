FROM node:20-alpine AS base

# --- Production Stage ---
FROM base AS production
ENV NODE_ENV=production
WORKDIR /app

# Copy package files from the build directory
COPY build/package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy the rest of the build output
COPY build/ .

EXPOSE 3333

# Start the server
CMD ["node", "bin/server.js"]
