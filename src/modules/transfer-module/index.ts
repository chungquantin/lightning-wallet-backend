import { ApolloServer } from 'apollo-server';
import Container from 'typedi';
import { buildFederatedSchema } from '../../common/helpers/buildFederatedSchema';
import { REDIS, redisPubSub } from '../../common/helpers/redis';
import { ResolveTime } from '../../common/middleware';
import { customAuthChecker } from '../../common/utils/authChecker';
import { Wallet } from './entity';
import * as WalletResolver from './resolvers/wallet';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
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

export async function listen(port: number): Promise<string> {
	if (!env(EnvironmentType.PROD)) {
		await new REDIS().server.flushall();
	}
	let conn: Connection;
	try {
		conn = await getConnection('default');
	} catch (error) {
		conn = await genORMConnection({
			databaseName: 'account',
		});
	}

	return withRabbitMQConnect(
		'TRANSFER',
		'amqps://glsybgql:k-oBlQmxYuFpOboPLTqItT_XS6fSJdbu@gerbil.rmq.cloudamqp.com/glsybgql',
		async ({ channel }) => {
			const schema = await buildFederatedSchema(
				{
					resolvers: [WalletResolver.HelloWorldResolver],
					orphanedTypes: [Wallet],
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
				context: ({ req }): Partial<GQLContext> => {
					const redis = new REDIS().server;

					const token =
						req.body.token ||
						req.query.token ||
						req.headers['x-access-token'];

					try {
						if (token !== '') {
							const decoded = jwt.verify(
								token,
								process.env.TOKEN_KEY,
							);
							req.user = decoded;
							return {
								request: req,
								redis,
								currentUser: req.user || undefined,
								url: req?.protocol + '://' + req?.get('host'),
							};
						}
						return {
							request: req,
							redis,
							currentUser: JSON.parse(req.headers.currentuser),
							url: req?.protocol + '://' + req?.get('host'),
						};
					} catch (error) {
						return {
							request: req,
							redis,
							currentUser: undefined,
							url: req?.protocol + '://' + req?.get('host'),
						};
					}
				},
			});

			const { url } = await server.listen({ port });
			console.log(`--- [SERVICE: TRANSFER] Ready at ${url}`);
			console.table(
				env(EnvironmentType.PROD)
					? {
							SERVICE_NAME: 'TRANSFER',
							SERVICE_ENDPOINT: url,
							ENVIRONMENT: process.env.NODE_ENV?.trim(),
							PROCESS_ID: process.pid,
							DATABASE_URL: process.env.DATABASE_URL,
							REDIS_HOST: process.env.REDIS_HOST,
							REDIS_PORT: process.env.REDIS_PORT,
					  }
					: {
							SERVICE_NAME: 'TRANSFER',
							SERVICE_ENDPOINT: url,
							ENVIRONMENT: process.env.NODE_ENV?.trim(),
							PROCESS_ID: process.pid,
							PORT: port,
							DATABASE: conn?.options.database,
					  },
			);

			return url;
		},
	);
}
