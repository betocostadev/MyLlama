FROM oven/bun:1-alpine AS base
WORKDIR /app

# Copy root workspace and package manifests
COPY package.json ./
COPY packages/types/package.json ./packages/types/package.json
COPY apps/server/package.json ./apps/server/package.json

# Copy shared types package
COPY packages/types ./packages/types

# Install dependencies across workspace
RUN bun install --production

# Copy server source code and configuration
COPY apps/server ./apps/server

WORKDIR /app/apps/server

ENV PORT=4000
ENV NODE_ENV=production

EXPOSE 4000

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:4000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["bun", "src/index.ts"]
