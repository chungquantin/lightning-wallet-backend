FROM node:14-alpine

RUN mkdir lnd

COPY package.json ./package.json
COPY tsconfig.json ./tsconfig.json
COPY ormconfig.json ./ormconfig.json
COPY .env ./.env
COPY . ./
RUN npm i --legacy-peer-deps
RUN npm run build

EXPOSE 6379

CMD cd dist && node index.js
