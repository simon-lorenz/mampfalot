FROM node:12-alpine

WORKDIR /server

COPY package*.json ./

COPY .npmrc .

RUN npm install

COPY . .

EXPOSE 5000

CMD ["node", "app.js"]
