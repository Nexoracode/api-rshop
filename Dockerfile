# مرحله Build
FROM node:20-alpine AS builder

# نصب ابزارهای مورد نیاز
RUN apk add --no-cache python3 make g++

# تنظیم دایرکتوری کاری
WORKDIR /app

# کپی فایل‌های package
COPY package*.json ./

# نصب همه dependencies (شامل devDependencies برای build)
RUN npm ci && npm cache clean --force

# کپی کل پروژه
COPY . .

# Build کردن پروژه
RUN npm run build

# مرحله Production
FROM node:20-alpine

# نصب dumb-init برای مدیریت بهتر process
RUN apk add --no-cache dumb-init

# ایجاد یوزر غیر root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# کپی package files
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# نصب production dependencies + typeorm برای migrations
RUN npm ci --only=production && \
    npm install typeorm --save && \
    npm cache clean --force

# کپی فایل‌های ضروری از مرحله builder
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# کپی فایل env مناسب
COPY --chown=nestjs:nodejs .env.production ./.env

# ایجاد پوشه‌های مورد نیاز
RUN mkdir -p /app/public /app/uploads && \
    chown -R nestjs:nodejs /app/public /app/uploads

# تنظیم متغیرهای محیطی
ENV NODE_ENV=production
ENV PORT=3001

# Switch به یوزر غیر root
USER nestjs

# Expose کردن پورت
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# اجرای برنامه با dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/src/main.js"]
