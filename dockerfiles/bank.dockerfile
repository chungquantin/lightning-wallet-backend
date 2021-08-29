
FROM node:latest

RUN mkdir bank
COPY package.json ./package.json
COPY src/modules/bank-module ./src/modules/bank-module
RUN npm i
RUN npm run build

CMD cd src/modules/bank-module && node dist/index.js