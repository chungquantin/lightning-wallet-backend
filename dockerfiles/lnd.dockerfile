
FROM node:latest

RUN mkdir lnd
COPY package.json ./package.json
COPY package-lock.json ./package-lock.json
COPY dist/modules/lnd-module ./dist/modules/lnd-module
RUN npm i

CMD cd dist/modules/lnd-module && node index.js