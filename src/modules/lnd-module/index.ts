import { ApolloServer } from 'apollo-server';
import Container from 'typedi';
import { buildFederatedSchema } from '../../common/helpers/buildFederatedSchema';
import { REDIS, redisPubSub } from '../../common/helpers/redis';
import { ResolveTime } from '../../common/middleware';
import { customAuthChecker } from '../../common/utils/authChecker';
import { MemcachedCache } from 'apollo-server-cache-memcached';
import { GQLContext } from '../../common/utils/graphql-utils';
import { printSchemaWithDirectives } from 'graphql-tools';
import withRabbitMQConnect from '../../common/helpers/withRabbitMqConnect';
import {
	env,
	EnvironmentType,
} from '../../common/utils/environmentType';
import { Connection, getConnection } from 'typeorm';
import { genORMConnection } from '../../common/helpers/orm.config';
import { queueHandler } from './queue';
import * as LndResolver from './resolvers/node';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';

export interface WalletGQLContext extends GQLContext {
	dataSources: {};
}

export async function listen(
	port: number,
): Promise<string | undefined> {
	return withRabbitMQConnect({
		name: 'LND',
		url: 'amqps://glsybgql:k-oBlQmxYuFpOboPLTqItT_XS6fSJdbu@gerbil.rmq.cloudamqp.com/glsybgql',
		callback: async ({ channel }) => {
			if (!env(EnvironmentType.PROD)) {
				await new REDIS().server.flushall();
			}
			let conn: Connection;
			try {
				conn = await getConnection('default');
			} catch (error) {
				conn = await genORMConnection({
					databaseName: 'lnd',
					connection: 'default',
				});
			}
			if (channel) {
				queueHandler(conn, channel);
			}
			const schema = await buildFederatedSchema(
				{
					resolvers: [
						LndResolver.LndGetTransactions,
						LndResolver.LndGetTransactions,
					],
					orphanedTypes: [],
					container: Container,
					pubSub: redisPubSub,
					authChecker: customAuthChecker,
					globalMiddlewares: [ResolveTime],
				},
				{},
				__dirname,
			);

			const sdl = printSchemaWithDirectives(schema);
			await fs.writeFileSync(__dirname + '/schema.graphql', sdl);

			const server = new ApolloServer({
				schema,
				cache: new MemcachedCache(
					[
						'memcached-server-1',
						'memcached-server-2',
						'memcached-server-3',
					],
					{ retries: 10, retry: 10000 }, // Options
				),
				context: ({ req }): Partial<WalletGQLContext> => {
					const redis = new REDIS().server;

					const contextResponse = {
						request: req,
						redis,
						channel,
						dataSources: {},
						url: req?.protocol + '://' + req?.get('host'),
					};

					try {
						const token =
							req.body.token ||
							req.query.token ||
							req.headers['x-access-token'];
						if (token) {
							const decoded = jwt.verify(
								token,
								process.env.TOKEN_KEY,
							);
							req.user = decoded;
							return Object.assign(contextResponse, {
								currentUser: req.user || undefined,
							});
						}
						return Object.assign(contextResponse, {
							currentUser: JSON.parse(req.headers.currentuser),
						});
					} catch (error) {
						return Object.assign(contextResponse, {
							currentUser: undefined,
						});
					}
				},
			});

			const { url } = await server.listen({ port });
			console.log(`--- [SERVICE: LIGHTNING-DAEMON] Ready at ${url}`);
			console.table(
				env(EnvironmentType.PROD)
					? {
							SERVICE_NAME: 'LIGHTNING-DAEMON',
							SERVICE_ENDPOINT: url,
							ENVIRONMENT: process.env.NODE_ENV?.trim(),
							PROCESS_ID: process.pid,
							DATABASE_URL: process.env.DATABASE_URL,
							REDIS_HOST: process.env.REDIS_HOST,
							REDIS_PORT: process.env.REDIS_PORT,
					  }
					: {
							SERVICE_NAME: 'LIGHTNING-DAEMON',
							SERVICE_ENDPOINT: url,
							ENVIRONMENT: process.env.NODE_ENV?.trim(),
							PROCESS_ID: process.pid,
							PORT: port,
							DATABASE: conn?.options.database,
					  },
			);

			return url;
		},
	});
}
