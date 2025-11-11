FROM node:20-slim

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src

RUN npm install
RUN npm run build

ENV NODE_ENV=production

EXPOSE 3002

CMD ["node", "dist/index.js"]
