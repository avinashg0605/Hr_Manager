# Stage 1: Build
FROM node:alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Stage 2: Production
FROM node:alpine

WORKDIR /app

COPY --from=build /app ./

RUN npm install --production

EXPOSE 3000

CMD ["npm", "start"]