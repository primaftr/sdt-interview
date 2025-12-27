# ---------- Base ----------
FROM node:24-alpine AS base
WORKDIR /app

# ---------- Dependencies ----------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---------- Build ----------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules

# copy source
COPY . .

# build NestJS
RUN npm run build

# generate Prisma client (uses schema only, no DB connection)
RUN npx prisma generate

# ---------- Runtime ----------
FROM base AS runner
ENV NODE_ENV=production

# copy runtime deps
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# copy Prisma artifacts
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/package.json ./package.json

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
