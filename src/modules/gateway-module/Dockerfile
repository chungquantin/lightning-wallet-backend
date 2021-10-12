FROM node:14-alpine

RUN mkdir gateway

COPY package.json ./package.json
COPY tsconfig.json ./tsconfig.json
COPY .env ./.env
COPY . ./
RUN npm i --legacy-peer-deps
RUN npm run build

CMD cd dist && node index.js
