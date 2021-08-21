import 'reflect-metadata';
import 'dotenv/config';
//import { GraphQLServer, Options } from 'graphql-yoga';
import { genSchema } from './utils/genSchema';
import { sessionConfiguration } from './helper/session';
import { REDIS } from './helper/redis';
import { env, EnvironmentType } from './utils/environmentType';
import { formatValidationError } from './utils/formatValidationError';
import { GQLContext } from './utils/graphql-utils';
import { genORMConnection } from './config/orm.config';
import { printSchema } from 'graphql';
import { logger } from './config/winston.config';
import { DEV_BASE_URL } from './constants/global-variables';
import { register } from 'prom-client';
import { Connection } from 'typeorm';
import { ApolloServer } from 'apollo-server-express';
import { MemcachedCache } from 'apollo-server-cache-memcached';
import * as cors from 'cors';
import * as fs from 'fs';
import * as express from 'express';

// import NodeMailerService from "./helper/email";
// import { DEV_BASE_URL } from "./constants/global-variables";

export const startServer = async () => {
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

	const corsOptions = {
		credentials:
			env(EnvironmentType.PROD) || env(EnvironmentType.PROD_STAGE),
		origin: DEV_BASE_URL,
	};

	const server = new ApolloServer({
		schema,
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
			return {
				request: req,
				redis: new REDIS().server,
				session: req.session,
				url: req?.protocol + '://' + req?.get('host'),
			};
		},
	});

	await server.start();

	const app = express();
	app.use(sessionConfiguration);

	server.applyMiddleware({ app });

	app.use(sessionConfiguration);
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
					ENDPOINT: `${process.env.SERVER_URI}:${PORT}${process.env.SERVER_ENDPOINT}`,
					ENVIRONMENT: process.env.NODE_ENV?.trim(),
					PROCESS_ID: process.pid,
					DATABASE_URL: process.env.DATABASE_URL,
					REDIS_HOST: process.env.REDIS_HOST,
					REDIS_PORT: process.env.REDIS_PORT,
			  }
			: {
					ENDPOINT: `${process.env.SERVER_URI}:${PORT}${process.env.SERVER_ENDPOINT}`,
					ENVIRONMENT: process.env.NODE_ENV?.trim(),
					PROCESS_ID: process.pid,
					PORT: PORT,
					DATABASE: conn?.options.database,
			  },
	);
};
