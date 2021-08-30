
FROM node as build
RUN mkdir account

COPY package.json ./package.json
COPY tsconfig.json ./tsconfig.json
COPY src/modules/account-module ./src/modules/account-module
RUN npm i

CMD cd src/modules/account-module && node index.js