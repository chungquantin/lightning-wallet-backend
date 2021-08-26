import 'dotenv/config';

export enum EnvironmentType {
	PROD = 'production',
	PROD_STAGE = 'production-staging',
	DEV = 'development',
	STAGE = 'staging',
	TEST = 'test',
}

export const env = (type: EnvironmentType): boolean => {
	return process.env.NODE_ENV?.trim() == type;
};
