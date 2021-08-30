
FROM node as build
RUN mkdir bank

COPY package.json ./package.json
COPY tsconfig.json ./tsconfig.json
COPY src/modules/account-module ./src/modules/account-module
RUN npm i --legacy-peer-deps

CMD cd dist/modules/account-module && node index.js