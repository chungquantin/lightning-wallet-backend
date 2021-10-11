FROM node:14-alpine

RUN mkdir account

COPY package.json ./package.json
COPY tsconfig.json ./tsconfig.json
COPY ormconfig.json ./ormconfig.json
COPY .env ./.env
COPY src/modules/account-module ./src/modules/account-module
RUN npm i --legacy-peer-deps
RUN npm run build

EXPOSE 6379

CMD node dist/index.js
