# Stage 1: Build the app
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

# فقط npm install ساده، بدون نصب مجدد npm
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Create the production image
FROM node:20-alpine  

WORKDIR /usr/src/app

COPY package*.json ./

# فقط نصب وابستگی‌های پروداکشن
RUN npm install --omit=dev

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

CMD [ "node", "dist/src/main.js" ]