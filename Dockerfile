FROM node:12-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production && npm cache clean --force

COPY ./src ./src
COPY app.js ./
COPY LICENSE ./

EXPOSE 5000

CMD ["node", "app.js"]
