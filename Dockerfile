# syntax=docker/dockerfile:1
FROM oven/bun:1 AS base

# Stage 1: Prune the workspace to isolate the web app dependencies
FROM base AS builder
WORKDIR /app
COPY . .
RUN bunx turbo prune web --docker

# Stage 2: Install dependencies and build the application
FROM base AS installer
WORKDIR /app

# Copy the pruned package.json files and bun.lock
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/bun.lock .
RUN bun install

# Copy the actual source code
COPY --from=builder /app/out/full/ .
# Build the Next.js app in standalone mode
RUN bunx turbo build --filter=web

# Stage 3: Minimal runner image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# The standalone build outputs a minimal subset of files required to run
# It places the output in /app/apps/web/.next/standalone
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Optional: if you have a public directory, uncomment this
# COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

EXPOSE 3000

# The standalone output produces a server.js file that acts as the entrypoint
CMD ["node", "apps/web/server.js"]
