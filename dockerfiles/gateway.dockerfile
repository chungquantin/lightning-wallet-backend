FROM node:14-alpine

RUN mkdir gateway
COPY package.json ./package.json
COPY tsconfig.json ./tsconfig.json
COPY ormconfig.json ./ormconfig.json
COPY .env ./.env
COPY src/gateway.js ./src/gateway.js
RUN npm i --legacy-peer-deps
RUN npm run build

CMD node dist/index.js
