FROM node:20-slim AS base

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    sqlite3 \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

FROM base AS deps
WORKDIR /app

COPY frontend/package*.json ./

RUN npm ci

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY frontend/ .

RUN cd node_modules/better-sqlite3 && npm run build-release || true

RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN apt-get update && apt-get install -y \
    sqlite3 \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules ./node_modules

RUN chown -R nextjs:nextjs /app
COPY --chown=nextjs:nextjs ./cpg.db /app/cpg.db
USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]