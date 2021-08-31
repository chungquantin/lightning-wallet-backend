import * as Redis from 'ioredis';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import 'dotenv/config';

const config = {
	DEV: true,
	REDIS_HOST: 'ec2-44-197-80-249.compute-1.amazonaws.com',
	REDIS_PORT: 13900,
	REDIS_PASSWORD:
		'p96fe9623bc9be4c7ba5fedf416e1435a510a87a1545bed93a11842103818ea83',
};

export class REDIS {
	private readonly config: Redis.RedisOptions = {
		port: !config.DEV ? config.REDIS_PORT : 6379, // Redis port
		host: !config.DEV ? config.REDIS_HOST : 'redis', // Redis host,
		password: !config.DEV ? (config.REDIS_PASSWORD as string) : '',
	};
	public server = new Redis(this.config);
	public client = new Redis(this.config);
}

export const redisPubSub = new RedisPubSub({
	connection: {
		host: !config.DEV ? config.REDIS_HOST : 'redis',
		port: !config.DEV ? config.REDIS_PORT : 6379,
	},
	publisher: new REDIS().server,
	subscriber: new REDIS().client,
});
