FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN ./node_modules/.bin/nest build

EXPOSE 3000
CMD ["node", "dist/src/main.js"]