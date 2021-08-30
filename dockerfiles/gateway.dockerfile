FROM node:latest

RUN mkdir gateway
COPY package.json ./package.json
COPY dist/gateway.js ./dist/gateway.js
RUN npm i

CMD cd dist & node index.js