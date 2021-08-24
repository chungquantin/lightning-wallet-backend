import { printSchema } from '@apollo/federation';
import { ApolloServer } from 'apollo-server';
import Container from 'typedi';
import { buildFederatedSchema } from '../../helpers/buildFederatedSchema';
import { REDIS, redisPubSub } from '../../helpers/redis';
import { ResolveTime } from '../../middleware';
import { customAuthChecker } from '../../utils/authChecker';
import { User } from './entity';
import * as UserResolver from './resolvers/user';
import * as fs from 'fs';
import { MemcachedCache } from 'apollo-server-cache-memcached';
import { GQLContext } from '../../utils/graphql-utils';

export async function listen(port: number): Promise<string> {
	const schema = await buildFederatedSchema({
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
	});

	const sdl = printSchema(schema);
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
		context: ({ req }): Partial<GQLContext | undefined> => {
			try {
				return {
					request: req,
					redis: new REDIS().server,
					currentUser: JSON.parse(req.headers.currentuser),
					url: req?.protocol + '://' + req?.get('host'),
				};
			} catch (error) {
				console.log(error.message);
				return undefined;
			}
		},
	});

	const { url } = await server.listen({ port });
	console.log(`+ Account Creation service ready at ${url}`);

	return url;
}
