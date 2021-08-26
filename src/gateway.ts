import 'reflect-metadata';
import 'dotenv/config';
//import { genSchema } from './helpers/genSchema';
import { REDIS } from './common/helpers/redis';
import { env, EnvironmentType } from './common/utils/environmentType';
import { formatValidationError } from './common/utils/formatValidationError';
import { GQLContext } from './common/utils/graphql-utils';
import { genORMConnection } from './common/config/orm.config';
import { logger } from './common/config/winston.config';
import { DEV_BASE_URL } from './common/constants/global-variables';
import { register } from 'prom-client';
import { Connection } from 'typeorm';
import { ApolloServer } from 'apollo-server-express';
import { MemcachedCache } from 'apollo-server-cache-memcached';
import {
	ApolloGateway,
	RemoteGraphQLDataSource,
	ServiceEndpointDefinition,
} from '@apollo/gateway';
import * as cors from 'cors';
import * as fs from 'fs';
import * as express from 'express';
import * as expressJwt from 'express-jwt';
import * as jwt from 'jsonwebtoken';
import { AccountCreationModule, TransferModule } from './modules';
import { printSchemaWithDirectives } from 'graphql-tools';

// import NodeMailerService from "./helper/email";
// import { DEV_BASE_URL } from "./constants/global-variables";

export const buildGateway = async () => {
	if (!env(EnvironmentType.PROD)) {
		await new REDIS().server.flushall();
	}

	let retries = 5;
	let conn: Connection | null = null;
	while (retries) {
		try {
			conn = await genORMConnection();
			break;
		} catch (error) {
			logger.error(error.message);
			retries -= 1;
			console.log(`retries left: ${retries}`);
			// wait 5 seconds before retry
			await new Promise((res) => setTimeout(res, 5000));
		}
	}

	const app = express();

	const serviceList: ServiceEndpointDefinition[] = [
		{
			name: 'account-creation-module',
			url: await AccountCreationModule.listen(3001),
		},
		{
			name: 'transfer-module',
			url: await TransferModule.listen(3002),
		},
	];

	const gateway = new ApolloGateway({
		serviceList,
		buildService({ url }) {
			return new RemoteGraphQLDataSource({
				url,
				willSendRequest({ request, context }) {
					request.http?.headers.set(
						'currentUser',
						(context as any).currentUser
							? JSON.stringify((context as any).currentUser)
							: '',
					);
				},
			});
		},
	});

	const { schema, executor } = await gateway.load();

	const sdl = printSchemaWithDirectives(schema);
	await fs.writeFileSync(__dirname + '/schema.graphql', sdl);

	const corsOptions = {
		credentials:
			env(EnvironmentType.PROD) || env(EnvironmentType.PROD_STAGE),
		origin: DEV_BASE_URL,
	};

	const server = new ApolloServer({
		schema,
		executor,
		formatError: (err) => {
			err.message = formatValidationError(err);
			return err;
		},
		cache: new MemcachedCache(
			[
				'memcached-server-1',
				'memcached-server-2',
				'memcached-server-3',
			],
			{ retries: 10, retry: 10000 }, // Options
		),
		context: ({ req }): Partial<GQLContext> => {
			const token =
				req.body.token ||
				req.query.token ||
				req.headers['x-access-token'];

			try {
				if (token !== '') {
					const decoded = jwt.verify(token, process.env.TOKEN_KEY);
					req.user = decoded;
				}
				return {
					request: req,
					currentUser: req.user || undefined,
					redis: new REDIS().server,
					url: req?.protocol + '://' + req?.get('host'),
				};
			} catch (error) {
				return {
					request: req,
					currentUser: undefined,
					redis: new REDIS().server,
					url: req?.protocol + '://' + req?.get('host'),
				};
			}
		},
	});

	await server.start();

	server.applyMiddleware({ app });

	app.use(
		expressJwt({
			secret: 'f1BtnWgD3VKY',
			algorithms: ['HMACSHA256'],
			credentialsRequired: false,
		}),
	);
	app.use(cors(corsOptions));
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));

	app.use('*', (req, _, next) => {
		const query = req.query.query || req.body.query || '';
		if (query.length > 2000) {
			throw new Error('Query too large');
		}
		next();
	});

	// Grafana Configuration
	app.use('/metric', async (req, res) => {
		try {
			res.set('Content-Type', register.contentType);
			res.end(await register.metrics());
		} catch (err) {
			res.status(500).end(err);
		}
	});

	const PORT = env(EnvironmentType.TEST)
		? 8080
		: process.env.PORT || 3000;

	await app.listen({ port: PORT });

	logger.info(
		env(EnvironmentType.PROD)
			? {
					GATEWAY_ENDPOINT: `${process.env.SERVER_URI}:${PORT}${process.env.SERVER_ENDPOINT}`,
					ENVIRONMENT: process.env.NODE_ENV?.trim(),
					PROCESS_ID: process.pid,
					DATABASE_URL: process.env.DATABASE_URL,
					REDIS_HOST: process.env.REDIS_HOST,
					REDIS_PORT: process.env.REDIS_PORT,
			  }
			: {
					GATEWAY_ENDPOINT: `${process.env.SERVER_URI}:${PORT}${process.env.SERVER_ENDPOINT}`,
					ENVIRONMENT: process.env.NODE_ENV?.trim(),
					PROCESS_ID: process.pid,
					PORT: PORT,
					DATABASE: conn?.options.database,
			  },
	);
};
