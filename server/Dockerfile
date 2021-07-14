FROM node:16.5.0-alpine

WORKDIR /server

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["node", "app.js"]
