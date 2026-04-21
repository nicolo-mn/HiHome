FROM node:24-slim
WORKDIR /app

RUN corepack enable pnpm

# Copy workspace configs
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY backend/package.json ./backend/

RUN pnpm install --frozen-lockfile

COPY backend ./backend

RUN pnpm --filter backend run build

EXPOSE 3000

CMD ["pnpm", "--filter", "backend", "run", "start"]
