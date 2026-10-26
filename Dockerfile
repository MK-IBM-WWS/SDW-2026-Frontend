FROM node:24-alpine AS development
WORKDIR /app
COPY package.json package-lock.json ./
COPY .npmrc ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
