import { ApolloServer } from "apollo-server";
import Container from "typedi";
import { buildFederatedSchema } from "neutronpay-wallet-common/dist/helpers/buildFederatedSchema";
import { REDIS, redisPubSub } from "./cache";
import { ResolveTime } from "neutronpay-wallet-common/dist/middleware";
import { customAuthChecker } from "neutronpay-wallet-common/dist/utils";
import { Wallet } from "./entity";
import { MemcachedCache } from "apollo-server-cache-memcached";
import { GQLContext } from "neutronpay-wallet-common/dist/utils/graphql-utils";
import { printSchemaWithDirectives } from "graphql-tools";
import { withRabbitMQConnect } from "./rabbit";
import {
  env,
  EnvironmentType
} from "neutronpay-wallet-common/dist/utils/environmentType";
import { Connection } from "typeorm";
import { genORMConnection } from "neutronpay-wallet-common/dist/helpers/orm.config";
import { queueHandler } from "./queue";
import * as WalletResolver from "./resolvers/wallet";
import * as PaymentResolver from "./resolvers/payment";
import * as fs from "fs";
import * as jwt from "jsonwebtoken";
import { dataSource } from "./utils";

export interface WalletGQLContext extends GQLContext {
  dataSources: {
    exchangeRateApi: dataSource.ExchangeRateApi;
  };
}

export async function listen(port: number): Promise<string | undefined> {
  return withRabbitMQConnect({
    name: "TRANSFER",
    url:
      "amqps://lvbzzlva:Elg4XFIZ99gS1Cp2EN2_0__zp_FFdHXt@mustang.rmq.cloudamqp.com/lvbzzlva",
    callback: async ({ channel }) => {
      if (!env(EnvironmentType.PROD)) {
        await new REDIS().server.flushall();
      }
      let conn: Connection;
      conn = await genORMConnection({
        connection: "default",
        service: "TRANSFER"
      });
      if (channel) {
        queueHandler(conn, channel);
      }
      const schema = await buildFederatedSchema(
        {
          resolvers: [
            // Wallet Resolver
            WalletResolver.GetMyWalletResolver,
            WalletResolver.GetWalletResolver,
            WalletResolver.GetWalletsResolver,
            WalletResolver.GetMyWalletTransactionsResolver,
            WalletResolver.GetTransactions,
            WalletResolver.GetTransaction,
            // Payment Request Resolver
            PaymentResolver.SendInAppPayment,
            PaymentResolver.SendOutAppLightningPayment,
            PaymentResolver.SendInAppLightningPayment,
            PaymentResolver.SendPaymentRequest,
            PaymentResolver.RespondPaymentRequest,
            PaymentResolver.GetPaymentRequest,
            PaymentResolver.GetPaymentRequests,
            PaymentResolver.GetMyPaymentRequests,
            PaymentResolver.CancelMyPaymentRequest
          ],
          orphanedTypes: [Wallet],
          container: Container,
          pubSub: redisPubSub,
          authChecker: customAuthChecker,
          globalMiddlewares: [ResolveTime]
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
        context: ({ req }): Partial<WalletGQLContext> => {
          const redis = new REDIS().server;

          const contextResponse = {
            request: req,
            redis,
            channel,
            dataSources: {
              exchangeRateApi: new dataSource.ExchangeRateApi()
            },
            url: req?.protocol + "://" + req?.get("host")
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
                currentUser: (req as any).user || undefined
              } as any);
            }
            return Object.assign(contextResponse, {
              currentUser: JSON.parse(req.headers.currentuser as string)
            } as any);
          } catch (error) {
            return Object.assign(contextResponse, {
              currentUser: undefined
            } as any);
          }
        }
      });

      const { url } = await server.listen({ port });
      console.log(`--- [SERVICE: TRANSFER] Ready at ${url}`);
      console.table(
        env(EnvironmentType.PROD)
          ? {
              SERVICE_NAME: "TRANSFER",
              SERVICE_ENDPOINT: url,
              ENVIRONMENT: process.env.NODE_ENV?.trim(),
              PROCESS_ID: process.pid,
              DATABASE_URL: process.env.DATABASE_URL,
              REDIS_HOST: process.env.REDIS_HOST,
              REDIS_PORT: process.env.REDIS_PORT
            }
          : {
              SERVICE_NAME: "TRANSFER",
              SERVICE_ENDPOINT: url,
              ENVIRONMENT: process.env.NODE_ENV?.trim(),
              PROCESS_ID: process.pid,
              PORT: port,
              DATABASE: conn?.options.database
            }
      );

      return url;
    }
  });
}
