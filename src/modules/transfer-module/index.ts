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

export async function listen(port: number): Promise<string> {
	try {
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
						const decoded = jwt.verify(token, process.env.TOKEN_KEY);
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
		console.log(`[SERVICE: TRANSFER] Ready at ${url}`);

		return url;
	} catch (error) {
		console.log('[SERVICE: TRANSFER] ERROR!!!');
		throw new Error(error);
	}
}
