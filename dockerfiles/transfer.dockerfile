
FROM node as build

RUN mkdir transfer
COPY package.json ./package.json
COPY package-lock.json ./package-lock.json
COPY dist/modules/transfer-module ./dist/modules/transfer-module
RUN npm i

CMD cd dist/modules/transfer-module && node index.js