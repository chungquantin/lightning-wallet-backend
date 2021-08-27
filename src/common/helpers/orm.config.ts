import {
	Connection,
	createConnection,
	getConnectionOptions,
} from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { env, EnvironmentType } from '../utils/environmentType';

export const genORMConnection = async ({
	databaseName,
	logging,
	connection,
}: Partial<{
	databaseName: string;
	logging: boolean;
	connection: string;
}>): Promise<Connection> => {
	const connectionOptions = await getConnectionOptions(
		connection
			? connection
			: env(EnvironmentType.PROD)
			? 'production-database'
			: 'dbConnection1',
	);
	const extendedOptions = {
		...connectionOptions,
		database: (connectionOptions.database +
			(env(EnvironmentType.TEST)
				? '-test'
				: `-${databaseName}` || '')) as any,
		dropSchema: env(EnvironmentType.TEST),
		namingStrategy: new SnakeNamingStrategy(),
		logging,
	};
	if (process.env.DATABASE_URL && env(EnvironmentType.PROD)) {
		Object.assign(extendedOptions, {
			url: process.env.DATABASE_URL,
			ssl: { rejectUnauthorized: false },
		});
	} else {
		Object.assign(extendedOptions, {
			host: process.env.DATABASE_HOST,
			username: process.env.DATABASE_USERNAME,
			password: process.env.DATABASE_PASSWORD,
		});
	}

	return await createConnection(extendedOptions);
};
