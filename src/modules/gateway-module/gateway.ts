import "dotenv/config";
import { REDIS } from "neutronpay-wallet-common/dist/helpers/redis";
import {
  env,
  EnvironmentType
} from "neutronpay-wallet-common/dist/utils/environmentType";
import { formatValidationError } from "neutronpay-wallet-common/dist/utils/formatValidationError";
import { GQLContext } from "neutronpay-wallet-common/dist/utils/graphql-utils";
import { DEV_BASE_URL } from "neutronpay-wallet-common/dist/constants/global-variables";
import { register } from "prom-client";
import { ApolloServer } from "apollo-server-express";
import { MemcachedCache } from "apollo-server-cache-memcached";
import {
  ApolloGateway,
  RemoteGraphQLDataSource,
  ServiceEndpointDefinition
} from "@apollo/gateway";
import * as cors from "cors";
import * as fs from "fs";
import * as express from "express";
import * as expressJwt from "express-jwt";
import * as jwt from "jsonwebtoken";
import { printSchemaWithDirectives } from "graphql-tools";

// import NodeMailerService from "./helper/email";
// import { DEV_BASE_URL } from "./constants/global-variables";

export const buildGateway = async () => {
  const app = express();

  const serviceList: ServiceEndpointDefinition[] = [
    {
      name: "account-module",
      url: "http://localhost:3001"
    },
    {
      name: "transfer-module",
      url: "http://localhost:3002"
    },
    {
      name: "bank-module",
      url: "http://localhost:3003"
    },
    {
      name: "lnd-module",
      url: "http://localhost:3004"
    }
  ];

  const gateway = new ApolloGateway({
    serviceList,
    buildService({ url }) {
      return new RemoteGraphQLDataSource({
        url,
        willSendRequest({ request, context }) {
          request.http?.headers.set(
            "currentUser",
            (context as any).currentUser
              ? JSON.stringify((context as any).currentUser)
              : ""
          );
        }
      });
    }
  });

  const { schema, executor } = await gateway.load();

  const sdl = printSchemaWithDirectives(schema);
  fs.writeFileSync(__dirname + "/schema.graphql", sdl);

  const corsOptions = {
    credentials: env(EnvironmentType.PROD) || env(EnvironmentType.PROD_STAGE),
    origin: DEV_BASE_URL
  };

  const server = new ApolloServer({
    schema,
    executor,
    formatError: (err: any) => {
      err.message = formatValidationError(err);
      return err;
    },
    cache: new MemcachedCache(
      ["memcached-server-1", "memcached-server-2", "memcached-server-3"],
      { retries: 10, retry: 10000 } // Options
    ),
    context: ({ req }): Partial<GQLContext> => {
      const token =
        req.body.token || req.query.token || req.headers["x-access-token"];

      try {
        if (token !== "") {
          const decoded = jwt.verify(token, process.env.TOKEN_KEY as string);
          (req as any).user = decoded;
        }
        return {
          request: req,
          currentUser: (req as any).user || undefined,
          redis: new REDIS().server,
          url: req?.protocol + "://" + req?.get("host")
        };
      } catch (error) {
        return {
          request: req,
          currentUser: undefined,
          redis: new REDIS().server,
          url: req?.protocol + "://" + req?.get("host")
        };
      }
    }
  });

  await server.start();

  server.applyMiddleware({ app: app as any });

  app.use(
    expressJwt({
      secret: "f1BtnWgD3VKY",
      algorithms: ["HMACSHA256"],
      credentialsRequired: false
    })
  );
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("*", (req: any, _: any, next: any) => {
    const query = req.query.query || req.body.query || "";
    if (query.length > 2000) {
      throw new Error("Query too large");
    }
    next();
  });

  // Grafana Configuration
  app.use(
    "/metric",
    async (_: any, res: any): Promise<void> => {
      try {
        res.set("Content-Type", register.contentType);
        res.end(await register.metrics());
      } catch (err) {
        res.status(500).end(err);
      }
    }
  );

  const PORT = env(EnvironmentType.TEST) ? 8080 : process.env.PORT || 3000;

  app.listen({ port: PORT });

  console.log(
    `Gateway is ready at ${process.env.SERVER_URI}:${PORT}${process.env.SERVER_ENDPOINT}`
  );
};
