// Owner: Track 1

# --- build stage ---
FROM node:20-bookworm AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Runtime stage ---
FROM nginx:1.27

COPY --from=builder /app/dist /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=3s \
	CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

EXPOSE 90

CMD ["ngix", "-g", "daemon off;"]

FROM debian:bookworm-slim
WORKDIR /app
COPY --from=build /app/dist ./dist
