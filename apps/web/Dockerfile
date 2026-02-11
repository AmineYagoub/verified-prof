FROM node:22-alpine AS base


## -------------------- deps stage --------------------
FROM base AS builder
RUN apk add --no-cache python3 make g++ libc6-compat curl
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
# Increase Node heap for dependency install to avoid OOM
RUN --mount=type=cache,target=/root/.npm NODE_OPTIONS=--max-old-space-size=4096 npm install --no-audit --no-fund --force
COPY . .

# Build arguments for environment variables needed at build time
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WORKER_SERVICE_URL
ARG DATABASE_URL
ARG GITHUB_CLIENT_ID
ARG BETTER_AUTH_URL

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_WORKER_SERVICE_URL=${NEXT_PUBLIC_WORKER_SERVICE_URL}
ENV DATABASE_URL=${DATABASE_URL}
ENV GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
ENV BETTER_AUTH_URL=${BETTER_AUTH_URL}

RUN npx prisma generate
RUN npx nx run web:build --skip-nx-cache

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app
RUN npm install --cpu=x64 --os=linux sharp && npm cache clean --force
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application from builder
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 8080

ENV PORT=8080

ENV HOSTNAME="0.0.0.0"
CMD ["node", "apps/web/server.js"]
