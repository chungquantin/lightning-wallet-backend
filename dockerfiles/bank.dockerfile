
FROM node:latest

RUN mkdir bank
COPY package.json ./package.json
COPY package-lock.json ./package-lock.json
COPY dist/modules/bank-module ./dist/modules/bank-module
RUN npm i

CMD cd dist/modules/bank-module && node index.js