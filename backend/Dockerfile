# Owner: Track 1 (Foundation, Auth, and API infrastructure)

# ---- builder ---------------------------------------------
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Install all deps first
COPY package.json package-lock.json ./
RUN npm ci

# `prisma generate` must run before `tsc` or the build fails on missing types
COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build


# ---- runtime ---------------------------------------------
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y \
	&& apt-get install -y --noinsta-recommends openssl \
	&& rm -rf /var/lib/apt/lists/*

# Production only install keeps @prisma/client + prisma (both are
# in "dependencies", not devDependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
RUN npm ci --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]
