FROM node:22-bookworm-slim AS base

# Install build dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    python3 \
    make \
    g++ \
    gcc \
    libc6-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --omit=dev

# Copy prisma generated client
COPY libs/prisma/src/generated ./libs/prisma/src/generated

# Disable Husky and install production dependencies
RUN npm pkg delete scripts.prepare && \
    ENV HUSKY=0 && \
    npm rebuild

# Copy built application
COPY dist/apps/analyzer/ ./

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Set correct permissions
RUN chown -R appuser:nodejs /app

USER appuser

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "main.js"]
