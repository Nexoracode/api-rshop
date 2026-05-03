# Stage 1: Build the app
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
# این خط اپلیکیشن را بیلد می‌کند
RUN npm run build

# Stage 2: Create the production image
FROM node:20-alpine

WORKDIR /usr/src/app

# # فقط فایل‌های مورد نیاز پروداکشن را کپی کنید
COPY package*.json ./
RUN npm install --only=production

# فایل‌های بیلد شده را از مرحله قبل کپی کنید
COPY --from=builder /usr/src/app/dist ./dist

# اسکریپت startup را کپی و اجرایی کنید
COPY startup.sh ./startup.sh
RUN chmod +x ./startup.sh

# اپلیکیشن بیلد شده را اجرا کنید
CMD [ "sh", "startup.sh" ]