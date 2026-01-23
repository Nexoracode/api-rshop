# Stage 1: Build the app
# FROM node:20-alpine AS builder

# WORKDIR /usr/src/app

# COPY package*.json ./
# RUN npm install

# COPY . .
# # این خط اپلیکیشن را بیلد می‌کند
# RUN npm run build

# Stage 2: Create the production image
FROM node:20-alpine  

WORKDIR /usr/src/app

# # فقط فایل‌های مورد نیاز پروداکشن را کپی کنید
# COPY package*.json ./
# RUN npm install --only=production

# فایل‌های بیلد شده را از مرحله قبل کپی کنید
COPY --from=builder /usr/src/app/dist ./dist

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"
EXPOSE 3000

# اپلیکیشن بیلد شده را اجرا کنید
CMD [ "node", "dist/src/main.js" ]