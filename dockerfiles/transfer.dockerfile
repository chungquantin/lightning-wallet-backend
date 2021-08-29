
FROM node:latest

RUN mkdir transfer
COPY package.json ./package.json
COPY src/modules/transfer-module ./src/modules/transfer-module
RUN npm i
RUN npm run build

CMD cd src/modules/transfer-module && node dist/index.js