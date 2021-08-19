import 'reflect-metadata';
import 'dotenv/config';
import { GraphQLServer, Options } from 'graphql-yoga';
import { genSchema } from './utils/genSchema';
import { sessionConfiguration } from './helper/session';
import { REDIS } from './helper/redis';
import { env, EnvironmentType } from './utils/environmentType';
import { formatValidationError } from './utils/formatValidationError';
import { GQLContext } from './utils/graphql-utils';
import { ContextParameters } from 'graphql-yoga/dist/types';
import { genORMConnection } from './config/orm.config';
import { printSchema } from 'graphql';
import { logger } from './config/winston.config';
import * as fs from 'fs';
import * as express from 'express';
import { DEV_BASE_URL } from './constants/global-variables';
import { Connection } from 'typeorm';

// import NodeMailerService from "./helper/email";
// import { DEV_BASE_URL } from "./constants/global-variables";

export const startServer = async () => {
	console.log(process.env.NODE_ENV);

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

	const schema = await genSchema();

	const sdl = printSchema(schema);
	await fs.writeFileSync(__dirname + '/schema.graphql', sdl);

	const server = new GraphQLServer({
		schema,
		context: ({
			request,
		}: ContextParameters): Partial<GQLContext> => ({
			request,
			redis: new REDIS().server,
			session: request?.session,
			url: request?.protocol + '://' + request?.get('host'),
		}),
	} as any);

	const app = server.express;

	app.use(sessionConfiguration);
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));
	app.use('*', (req, _, next) => {
		const query = req.query.query || req.body.query || '';
		if (query.length > 2000) {
			throw new Error('Query too large');
		}
		next();
	});

	const corsOptions = {
		credentials: true,
		origin: DEV_BASE_URL,
	};

	const PORT = process.env.PORT || 5000;

	await server
		.start(
			Object.assign(
				{
					cors: corsOptions,
					port: env(EnvironmentType.TEST) ? 8080 : PORT,
					formatError: formatValidationError,
					subscriptions: {
						onConnect: () =>
							console.log('Subscription server connected!'),
						onDisconnect: () =>
							console.log('Subscription server disconnected!'),
					},
				} as Options,
				env(EnvironmentType.PROD) || env(EnvironmentType.PROD_STAGE)
					? {
							playground: env(EnvironmentType.PROD_STAGE),
					  }
					: {
							endpoint: '/graphql',
					  },
			),
			(options) => {
				logger.info(
					env(EnvironmentType.PROD)
						? {
								ENDPOINT: `${process.env.SERVER_URI}:${options?.port}${process.env.SERVER_ENDPOINT}`,
								ENVIRONMENT: process.env.NODE_ENV?.trim(),
								DATABASE_URL: process.env.DATABASE_URL,
								REDIS_HOST: process.env.REDIS_HOST,
								REDIS_PORT: process.env.REDIS_PORT,
						  }
						: {
								ENDPOINT: `${process.env.SERVER_URI}:${options?.port}${process.env.SERVER_ENDPOINT}`,
								ENVIRONMENT: process.env.NODE_ENV?.trim(),
								PORT: options.port,
								DATABASE: conn?.options.database,
						  },
				);
			},
		)
		.catch((err) => console.log(err));
};
