FROM oven/bun:1.3.11 as base
WORKDIR /app

COPY package.json bun.lock ./
COPY packages/ ./packages/
RUN bun install 

COPY server/ ./server/
COPY .env* ./

RUN bun run build

EXPOSE 3000

CMD ["bun", "run", "server/src/app.ts"]
