# Stage 1: Build the app
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# کپی فایل‌های package
COPY package*.json ./

# نصب تمام وابستگی‌ها (شامل devDependencies که nest cli داره)
RUN npm install

# کپی سورس کد
COPY . .

# بیلد کردن پروژه (با nest cli)
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /usr/src/app

# کپی فقط package.json ها
COPY package*.json ./

# نصب فقط وابستگی‌های پروداکشن
RUN npm install --omit=dev

# کپی فایل‌های بیلد شده از مرحله قبل
COPY --from=builder /usr/src/app/dist ./dist

# پورت اپلیکیشن
EXPOSE 3000

# اجرای اپلیکیشن (طبق script تو package.json)
CMD ["node", "dist/src/main.js"]