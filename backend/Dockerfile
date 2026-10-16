# ---- build stage: compile TypeScript ----
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- runtime stage: Chromium + production deps only ----
FROM node:22-bookworm-slim
ENV NODE_ENV=production \
    CHROME_PATH=/usr/bin/chromium

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      chromium fonts-liberation fonts-noto-color-emoji tini \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist

USER node
EXPOSE 8080
# tini reaps leftover Chrome processes so they don't pile up
ENTRYPOINT ["tini", "--"]
CMD ["node", "dist/index.js"]