# Stage 1: Build the app
FROM node:20-alpine AS builder

# اضافه کردن PATH صریح
ENV PATH=/usr/src/app/node_modules/.bin:$PATH

WORKDIR /usr/src/app

COPY package*.json ./

# نصب npm به صورت صریح (بعضی وقتا کمک می‌کنه)
RUN npm install -g npm@latest && npm install

COPY . .
RUN npm run build

# Stage 2: Create the production image
FROM node:20-alpine  

# اضافه کردن PATH صریح برای مرحله پروداکشن
ENV PATH=/usr/src/app/node_modules/.bin:$PATH

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=production

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

CMD [ "node", "dist/src/main.js" ]