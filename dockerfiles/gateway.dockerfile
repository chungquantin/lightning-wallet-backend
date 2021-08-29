FROM node:latest

RUN mkdir gateway
COPY package.json ./package.json
COPY src/gateway.ts ./src/gateway.js
RUN npm i
RUN npm run build

CMD cd src & node dist/gateway.js