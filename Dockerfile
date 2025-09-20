# Dev-friendly multi-stage build za Next.js

FROM node:20-bookworm AS base
WORKDIR /usr/src/app

# 1) deps: instaliraj ovisnosti (npm jer imamo package-lock.json)
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# 2) dev: hot-reload okruženje
FROM base AS dev
ENV PORT=3000
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm","run","dev"]

# 3) build (prod)
FROM base AS build
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
RUN npm run build

# 4) production runtime (za kasnije deploy, ne koristi se u compose dev-u)
FROM node:20-bookworm-slim AS prod
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY --from=build /usr/src/app/.next ./.next
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/package.json ./package.json
EXPOSE 3000
CMD ["npm","start"]

