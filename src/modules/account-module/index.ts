import { ApolloServer } from 'apollo-server';
import Container from 'typedi';
import { buildFederatedSchema } from '../../common/helpers/buildFederatedSchema';
import { REDIS, redisPubSub } from '../../common/helpers/redis';
import { ResolveTime } from '../../common/middleware';
import { customAuthChecker } from '../../common/utils/authChecker';
import { resolveUserReference, User } from './entity';
import { MemcachedCache } from 'apollo-server-cache-memcached';
import { GQLContext } from '../../common/utils/graphql-utils';
import { printSchemaWithDirectives } from 'graphql-tools';
import * as UserResolver from './resolvers/user';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import withRabbitMQConnect from '../../common/helpers/withRabbitMqConnect';
import {
	env,
	EnvironmentType,
} from '../../common/utils/environmentType';
import { genORMConnection } from '../../common/helpers/orm.config';
import { Connection, getConnection } from 'typeorm';
import { Channel } from 'amqplib';

const channelHandler = (channel: Channel) => {};

export async function listen(port: number): Promise<string> {
	return withRabbitMQConnect(
		'ACCOUNT',
		'amqps://glsybgql:k-oBlQmxYuFpOboPLTqItT_XS6fSJdbu@gerbil.rmq.cloudamqp.com/glsybgql',
		async ({ channel }) => {
			channelHandler(channel);

			let conn: Connection;
			try {
				conn = await getConnection('default');
			} catch (error) {
				conn = await genORMConnection({
					databaseName: 'account',
				});
			}

			const schema = await buildFederatedSchema(
				{
					resolvers: [
						UserResolver.LoginResolver,
						UserResolver.ForgotPasswordResolver,
						UserResolver.GetUserResolver,
						UserResolver.GetUsersResolver,
						UserResolver.LogoutResolver,
						UserResolver.MeResolver,
						UserResolver.RegisterResolver,
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
							return {
								request: req,
								redis,
								channel,
								currentUser: req.user || undefined,
								url: req?.protocol + '://' + req?.get('host'),
							};
						}
						return {
							request: req,
							redis,
							channel,
							currentUser: JSON.parse(req.headers.currentuser),
							url: req?.protocol + '://' + req?.get('host'),
						};
					} catch (error) {
						return {
							request: req,
							redis,
							channel,
							currentUser: undefined,
							url: req?.protocol + '://' + req?.get('host'),
						};
					}
				},
			});

			const { url } = await server.listen({ port });
			console.log(`--- [SERVICE: ACCOUNT] Ready at ${url}`);
			console.table(
				env(EnvironmentType.PROD)
					? {
							SERVICE_NAME: 'ACCOUNT',
							SERVICE_ENDPOINT: url,
							ENVIRONMENT: process.env.NODE_ENV?.trim(),
							PROCESS_ID: process.pid,
							DATABASE_URL: process.env.DATABASE_URL,
							REDIS_HOST: process.env.REDIS_HOST,
							REDIS_PORT: process.env.REDIS_PORT,
					  }
					: {
							SERVICE_NAME: 'ACCOUNT',
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
