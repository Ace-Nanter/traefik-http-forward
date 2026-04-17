FROM node:24-alpine AS build

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src

RUN pnpm build && pnpm prune --prod

FROM node:24-alpine

WORKDIR /app

ENV NODE_ENV=production
EXPOSE 3000

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

CMD ["dist/index.js"]