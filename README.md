# Wallet Microservice Bankend with Apollo Federation

**Required installation for:**

- Account
- Bank
- Transfer
- Lightning Daemon

**Required installation for:**

- Redis@3.0.504 for Windows / @5.0.X for Linux
- PostgreSQL 13

**Enviroment variables:**

More information can be found in file ".env.example"

SESSION_SECRET = *The secret key for session*
  
CLIENT_PORT = *The port of a client*
  
DATABASE_URL = *This is for database in production*
  
DATABASE_HOST = *The host of database | ie: http//localhost*

DATABASE_USERNAME = *The username of database admin*
  
DATABASE_PASSWORD = *The password of database admin*
  
REDIS_HOST = *The host of redis server | ie: localhost*

REDIS_PORT = *The port where redis server hosted*
  
REDIS_PASSWORD = *The password to connect to redis server*

SERVER_URI = *The uri of a server*
  
SERVER_ENDPOINT = *The endpoint of a server*

____________________________

**How to use?**

In package.json, we have several scripts which do specific things: 

`npm run start-services` : Run multiple services

`npm run start-gateway` : Run an apollo gateway

`npm run start:test` : Run a testing environment, the same as `start:dev`. However, the database drops its schemas on restart

`npm run test` : Run this after `npm run start:test` to run all unit tests

`npm run gen-gql` : Generate `graphql` schemas based on TypegraphQL resolver, this uses `gql-generators`

`npm run gen-env` : Generate environment type which is stored in `src/types`

____________________________

**How to dockerize?**

```
docker run build -f <path/to/file> -t <tagname> .
```

For example: docker run build -f dockerfiles/bank.dockerfile -t dockerfile .

__________________________

**Technologies:**

- TypeGraphQL: https://github.com/MichalLytek/type-graphql
- GraphQL Yoga: https://github.com/prisma-labs/graphql-yoga
- GQL Generators: https://github.com/prisma-labs/graphql-yoga
- TypeORM: https://github.com/typeorm/typeorm
- Class Validators: https://github.com/typestack/class-validator
- Yup: https://github.com/jquense/yup

**Testing tools:**

- Jest: Unit testing & TDD https://jestjs.io/

**Microservice:**

- Redis: https://github.com/luin/ioredis
- More...

