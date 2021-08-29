
FROM node:latest

RUN mkdir lnd
COPY package.json ./package.json
COPY src/modules/lnd-module ./src/modules/lnd-module
RUN npm i
RUN npm run build

CMD cd src/modules/lnd-module && node dist/index.js