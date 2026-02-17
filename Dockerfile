# Используем Node.js 20 slim
FROM node:20-slim AS base

# Устанавливаем build dependencies для компиляции better-sqlite3
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    sqlite3 \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

FROM base AS deps
WORKDIR /app

# Копируем package.json
COPY frontend/package*.json ./

# Устанавливаем зависимости
RUN npm ci

FROM base AS builder
WORKDIR /app

# Копируем node_modules и исходники
COPY --from=deps /app/node_modules ./node_modules
COPY frontend/ .

# Пересобираем better-sqlite3 для целевой архитектуры (если нужно)
RUN cd node_modules/better-sqlite3 && npm run build-release || true

# Сборка Next.js
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Устанавливаем runtime зависимости
RUN apt-get update && apt-get install -y \
    sqlite3 \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# Создаем пользователя
RUN useradd -m -u 1001 nextjs

# Копируем собранное приложение
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules ./node_modules

# Устанавливаем права
RUN chown -R nextjs:nextjs /app
COPY --chown=nextjs:nextjs ./cpg.db /app/cpg.db
USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]