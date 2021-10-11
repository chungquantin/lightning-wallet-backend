import { ApolloServer } from "apollo-server";
import Container from "typedi";
import { buildFederatedSchema } from "neutronpay-wallet-common/dist/helpers/buildFederatedSchema";
import { ResolveTime } from "neutronpay-wallet-common/dist/middleware";
import { customAuthChecker } from "neutronpay-wallet-common/dist/utils";
import { MemcachedCache } from "apollo-server-cache-memcached";
import { GQLContext } from "neutronpay-wallet-common/dist/utils/graphql-utils";
import { printSchemaWithDirectives } from "graphql-tools";
import { withRabbitMQConnect } from "./rabbit";
import {
  env,
  EnvironmentType,
} from "neutronpay-wallet-common/dist/utils/environmentType";
import { Connection, getConnection } from "typeorm";
import { genORMConnection } from "neutronpay-wallet-common/dist/helpers/orm.config";
import { queueHandler } from "./queue";
import { REDIS, redisPubSub } from "./cache";
import * as dataSources from "./utils/dataSource";
import * as NodeResolver from "./resolvers/node";
import * as BtcResolver from "./resolvers/btc";
import * as fs from "fs";
import * as jwt from "jsonwebtoken";

export interface LndGQLContext extends GQLContext {
  dataSources: {
    exchangeRateApi: dataSources.ExchangeRateApi;
  };
}

export async function listen(port: number): Promise<string | undefined> {
  return withRabbitMQConnect({
    name: "LND",
    url: "amqps://lvbzzlva:Elg4XFIZ99gS1Cp2EN2_0__zp_FFdHXt@mustang.rmq.cloudamqp.com/lvbzzlva",
    callback: async ({ channel }) => {
      if (!env(EnvironmentType.PROD)) {
        await new REDIS().server.flushall();
      }
      let conn: Connection;
      try {
        conn = getConnection("default");
      } catch (error) {
        conn = await genORMConnection({
          connection: "default",
          service: "LND",
        });
      }
      if (channel) {
        queueHandler(conn, channel);
      }
      const schema = await buildFederatedSchema(
        {
          resolvers: [
            NodeResolver.GetLightningTransactions,
            BtcResolver.GenerateChainInvoice,
            BtcResolver.GenerateLightningInvoice,
            BtcResolver.GetBtcAddress,
            BtcResolver.GetBtcAddresses,
          ],
          orphanedTypes: [],
          container: Container,
          pubSub: redisPubSub,
          authChecker: customAuthChecker,
          globalMiddlewares: [ResolveTime],
        },
        {},
        __dirname
      );

      const sdl = printSchemaWithDirectives(schema);
      fs.writeFileSync(__dirname + "/schema.graphql", sdl);

      const server = new ApolloServer({
        schema,
        cache: new MemcachedCache(
          ["memcached-server-1", "memcached-server-2", "memcached-server-3"],
          { retries: 10, retry: 10000 } // Options
        ),
        context: ({ req }): Partial<LndGQLContext> => {
          const redis = new REDIS().server;

          const contextResponse: Partial<LndGQLContext> = {
            request: req as any,
            redis,
            channel,
            dataSources: {
              exchangeRateApi: new dataSources.ExchangeRateApi(),
            },
            url: req ?.protocol + "://" + req ?.get("host"),
          };

          try {
            const token =
              req.body.token ||
              req.query.token ||
              req.headers["x-access-token"];
            if (token) {
              const decoded = jwt.verify(
                token,
                process.env.TOKEN_KEY as string
              );
              (req as any).user = decoded;
              return Object.assign(contextResponse, {
                currentUser: (req as any).user || undefined,
              } as any);
            }
            return Object.assign(contextResponse, {
              currentUser: JSON.parse(req.headers.currentuser as string),
            } as any);
          } catch (error) {
            return Object.assign(contextResponse, {
              currentUser: undefined,
            }) as any;
          }
        },
      });

      const { url } = await server.listen({ port });
      console.log(`--- [SERVICE: LIGHTNING-DAEMON] Ready at ${url}`);
      console.table(
        env(EnvironmentType.PROD)
          ? {
            SERVICE_NAME: "LIGHTNING-DAEMON",
            SERVICE_ENDPOINT: url,
            ENVIRONMENT: process.env.NODE_ENV ?.trim(),
            PROCESS_ID: process.pid,
            DATABASE_URL: process.env.DATABASE_URL,
            REDIS_HOST: process.env.REDIS_HOST,
            REDIS_PORT: process.env.REDIS_PORT,
          }
          : {
            SERVICE_NAME: "LIGHTNING-DAEMON",
            SERVICE_ENDPOINT: url,
            ENVIRONMENT: process.env.NODE_ENV ?.trim(),
            PROCESS_ID: process.pid,
            PORT: port,
            DATABASE: conn ?.options.database,
          }
      );

      return url;
    },
  });
}
