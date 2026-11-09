FROM oven/bun:1-alpine AS base
WORKDIR /app

# Copy server package manifest and install dependencies
COPY apps/server/package.json ./package.json
RUN bun install --production

# Copy server source code and configuration
COPY apps/server/tsconfig.json ./
COPY apps/server/src ./src

ENV PORT=4000
ENV NODE_ENV=production

EXPOSE 4000

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:4000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["bun", "src/index.ts"]
