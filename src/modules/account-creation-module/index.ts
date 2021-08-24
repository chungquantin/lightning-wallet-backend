import { printSchema } from '@apollo/federation';
import { ApolloServer } from 'apollo-server';
import Container from 'typedi';
import { buildFederatedSchema } from '../../helpers/buildFederatedSchema';
import { redisPubSub } from '../../helpers/redis';
import { ResolveTime } from '../../middleware';
import { customAuthChecker } from '../../utils/authChecker';
import { User } from './entity';
import * as UserResolver from './resolvers/user';
import * as fs from 'fs';
import { Connection } from 'typeorm';
import { genORMConnection } from '../../config/orm.config';
import { logger } from '../../config/winston.config';

export async function listen(port: number): Promise<string> {
	//let retries = 5;
	//let conn: Connection | null = null;
	//while (retries) {
	//	try {
	//		conn = await genORMConnection(true, 'production-database');
	//		break;
	//	} catch (error) {
	//		logger.error(error.message);
	//		retries -= 1;
	//		console.log(`retries left: ${retries}`);
	//		// wait 5 seconds before retry
	//		await new Promise((res) => setTimeout(res, 5000));
	//	}
	//}

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
	});

	const { url } = await server.listen({ port });
	console.log(`+ Account Creation service ready at ${url}`);

	return url;
}
