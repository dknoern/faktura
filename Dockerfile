# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# Build the application
RUN npm run build

# Stage 3: Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user to run the application
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the built node_modules from builder stage (includes TypeScript)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

# Copy the Next.js build output
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts

# Change ownership of node_modules to nextjs user
RUN chown -R nextjs:nodejs /app/node_modules

# Switch to non-root user
USER nextjs

# Expose the port the app will run on
EXPOSE 3000

# Environment variables must be redefined at runtime
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use Next.js start command instead of standalone
CMD ["npm", "start"]
