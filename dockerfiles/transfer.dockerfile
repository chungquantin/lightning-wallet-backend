FROM node:10-alpine

RUN mkdir transfer

COPY package.json ./package.json
COPY tsconfig.json ./tsconfig.json
COPY ormconfig.json ./ormconfig.json
COPY .env ./.env
COPY src/modules/transfer-module ./src/modules/transfer-module
RUN npm i --legacy-peer-deps
RUN npm run build

EXPOSE 6379

CMD node dist/index.js