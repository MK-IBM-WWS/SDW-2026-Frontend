FROM node:24-alpine AS development
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM development AS build
RUN npm run build

FROM node:24-alpine AS production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY scripts/https-server.mjs ./scripts/https-server.mjs
EXPOSE 3000
CMD ["node", "scripts/https-server.mjs"]
