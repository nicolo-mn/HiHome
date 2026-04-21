FROM --platform=$BUILDPLATFORM node:24-slim AS builder
WORKDIR /app

RUN corepack enable pnpm

# Copy workspace configs
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* vitest.config.ts ./
COPY frontend/package.json ./frontend/

RUN pnpm install --frozen-lockfile

COPY frontend ./frontend

RUN pnpm --filter frontend run build

FROM nginx:alpine
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
