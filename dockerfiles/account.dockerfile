
FROM node:latest

RUN mkdir account
COPY package.json ./package.json
COPY src/modules/account-module ./src/modules/account-module
RUN npm i
RUN npm run build

CMD cd src/modules/account-module && node dist/index.js