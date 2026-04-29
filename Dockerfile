FROM node:20-alpine

WORKDIR /app

# نصب وابستگی‌های مورد نیاز برای native modules
RUN apk add --no-cache python3 make g++

COPY package*.json ./

# نصب همه چیز (شامل dev dependencies)
RUN npm install

COPY . .

# بیلد پروژه
RUN npm run build

# پاک کردن devDependencies بعد از بیلد
RUN npm prune --production

EXPOSE 3000

CMD ["node", "dist/src/main.js"]