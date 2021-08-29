import {
	Connection,
	createConnection,
	getConnectionOptions,
} from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { env, EnvironmentType } from '../utils/environmentType';

export const genORMConnection = async ({
	service,
	database,
	databaseName,
	databaseUrl,
	logging,
	connection,
}: Partial<{
	service: 'ACCOUNT' | 'TRANSFER' | 'LND' | 'BANK';
	database: string;
	databaseName: string;
	databaseUrl: string;
	logging: boolean;
	connection: string;
}>): Promise<Connection> => {
	const connectionOptions = await getConnectionOptions(
		connection ? connection : 'production-database',
	);

	const extendedOptions = {
		...connectionOptions,
		database:
			process.env[`${service}_DATABASE`] ||
			((connectionOptions.database +
				(env(EnvironmentType.TEST)
					? '-test'
					: databaseName
					? `-${databaseName}`
					: '')) as any),
		dropSchema: env(EnvironmentType.TEST),
		namingStrategy: new SnakeNamingStrategy(),
		logging,
	};
	if (process.env.DATABASE_URL && env(EnvironmentType.PROD)) {
		Object.assign(extendedOptions, {
			url: databaseUrl || process.env[`${service}_DATABASE_URL`],
			ssl: { rejectUnauthorized: false },
		});
	} else {
		Object.assign(extendedOptions, {
			host: process.env[`${service}_DATABASE_HOST`],
			username: process.env[`${service}_DATABASE_USERNAME`],
			password: process.env[`${service}_DATABASE_PASSWORD`],
			ssl: { rejectUnauthorized: false },
		});
	}

	return await createConnection(extendedOptions);
};
