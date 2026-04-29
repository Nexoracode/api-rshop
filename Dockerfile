FROM node:20

RUN echo "=== Checking Node and npm ===" && \
    which node && \
    node --version && \
    which npm && \
    npm --version || echo "npm not found!"

WORKDIR /app
COPY package*.json ./
RUN ls -la && cat package.json

RUN npm install || echo "npm install failed!"

COPY . .
RUN npm run build || echo "npm run build failed!"

CMD ["node", "dist/src/main.js"]