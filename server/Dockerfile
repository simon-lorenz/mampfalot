FROM node:14-alpine

WORKDIR /server

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["node", "app.js"]
