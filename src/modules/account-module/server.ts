import { ApolloServer } from "apollo-server";
import Container from "typedi";
import { buildFederatedSchema } from "neutronpay-wallet-common/dist/helpers/buildFederatedSchema";
import { REDIS, redisPubSub } from "./cache";
import { ResolveTime } from "neutronpay-wallet-common/dist/middleware";
import { customAuthChecker } from "neutronpay-wallet-common/dist/utils";
import { resolveUserReference, User } from "./entity";
import { MemcachedCache } from "apollo-server-cache-memcached";
import { GQLContext } from "neutronpay-wallet-common/dist/utils/graphql-utils";
import { printSchemaWithDirectives } from "graphql-tools";
import * as UserResolver from "./resolvers/user";
import * as fs from "fs";
import * as jwt from "jsonwebtoken";
import { withRabbitMQConnect } from "./rabbit";
import {
  env,
  EnvironmentType,
} from "neutronpay-wallet-common/dist/utils/environmentType";
import { genORMConnection } from "neutronpay-wallet-common/dist/helpers/orm.config";
import { Connection } from "typeorm";

export async function listen(port: number): Promise<string | undefined> {
  return withRabbitMQConnect({
    name: "ACCOUNT",
    url: "amqps://lvbzzlva:Elg4XFIZ99gS1Cp2EN2_0__zp_FFdHXt@mustang.rmq.cloudamqp.com/lvbzzlva",
    callback: async ({ channel }) => {
      let conn: Connection;
      conn = await genORMConnection({
        service: "ACCOUNT",
        connection: "default",
      });

      const schema = await buildFederatedSchema(
        {
          resolvers: [
            UserResolver.LoginResolver,
            UserResolver.ForgotPasswordResolver,
            UserResolver.GetUserResolver,
            UserResolver.GetUsersResolver,
            UserResolver.LogoutResolver,
            UserResolver.GetCurrentUserResolver,
            UserResolver.GetMyContacts,
            UserResolver.RegisterResolver,
            UserResolver.AddNewContactResolver,
          ],
          orphanedTypes: [User],
          container: Container,
          pubSub: redisPubSub,
          authChecker: customAuthChecker,
          globalMiddlewares: [ResolveTime],
        },
        {
          User: {
            __resolveReference: resolveUserReference,
          },
        },
        __dirname
      );

      const sdl = printSchemaWithDirectives(schema as any);
      fs.writeFileSync(__dirname + "/schema.graphql", sdl);

      const server = new ApolloServer({
        schema,
        cache: new MemcachedCache(
          ["memcached-server-1", "memcached-server-2", "memcached-server-3"],
          { retries: 10, retry: 10000 } // Options
        ),
        context: ({ req }): Partial<GQLContext> => {
          const redis = new REDIS().server;

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
              return {
                request: req as any,
                redis,
                channel,
                currentUser: (req as any).user || undefined,
                url: req?.protocol + "://" + req?.get("host"),
              };
            }
            return {
              request: req as any,
              redis,
              channel,
              currentUser: JSON.parse(req.headers.currentuser as string),
              url: req?.protocol + "://" + req?.get("host"),
            };
          } catch (error) {
            return {
              request: req as any,
              redis,
              channel,
              currentUser: undefined,
              url: req?.protocol + "://" + req?.get("host"),
            };
          }
        },
      });

      const { url } = await server.listen({ port });
      console.log(`--- [SERVICE: ACCOUNT] Ready at ${url}`);
      console.table(
        env(EnvironmentType.PROD)
          ? {
              SERVICE_NAME: "ACCOUNT",
              SERVICE_ENDPOINT: url,
              ENVIRONMENT: process.env.NODE_ENV?.trim(),
              PROCESS_ID: process.pid,
              DATABASE_URL: process.env.DATABASE_URL,
              REDIS_HOST: process.env.REDIS_HOST,
              REDIS_PORT: process.env.REDIS_PORT,
            }
          : {
              SERVICE_NAME: "ACCOUNT",
              SERVICE_ENDPOINT: url,
              ENVIRONMENT: process.env.NODE_ENV?.trim(),
              PROCESS_ID: process.pid,
              PORT: port,
              DATABASE: conn?.options.database,
            }
      );

      return url;
    },
  });
}
