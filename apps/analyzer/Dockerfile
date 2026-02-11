FROM node:22-alpine AS base
RUN apk add --no-cache python3 make g++ libc6-compat curl openssl


## -------------------- deps stage --------------------
FROM base AS builder
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
# Increase Node heap for dependency install to avoid OOM
RUN --mount=type=cache,target=/root/.npm NODE_OPTIONS=--max-old-space-size=4096 npm install --no-audit --no-fund --force
COPY . .

# Build arguments for environment variables needed at build time
ARG DATABASE_URL
ARG GITHUB_CLIENT_ID
ARG GITHUB_CLIENT_SECRET
ARG BETTER_AUTH_URL

ENV DATABASE_URL=${DATABASE_URL}
ENV GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
ENV GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}
ENV BETTER_AUTH_URL=${BETTER_AUTH_URL}

RUN npx prisma generate
RUN npx nx run analyzer:build --skip-nx-cache


# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy prisma generated client
COPY --chown=nestjs:nodejs --from=builder /app/libs/prisma/src/generated ./libs/prisma/src/generated
COPY --chown=nestjs:nodejs --from=builder /app/dist/apps/analyzer ./

# Disable Husky and install production dependencies
RUN npm pkg delete scripts.prepare && \
    ENV HUSKY=0 
RUN npm install --omit=dev --force && npm cache clean --force

USER nestjs

ENV NODE_ENV=production
ENV PORT=8080
ENV ANALYZER_PORT=8080
EXPOSE 8080

CMD [ "node", "./main"]