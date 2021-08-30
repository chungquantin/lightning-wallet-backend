
FROM node as build

RUN mkdir bank

COPY package.json ./package.json
COPY tsconfig.json ./tsconfig.json
COPY src/modules/bank-module ./src/modules/bank-module
RUN npm i --legacy-peer-deps
RUN npm run build

CMD node dist/modules/bank-module/index.js