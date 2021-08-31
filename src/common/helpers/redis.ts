import * as Redis from 'ioredis';
import { RedisPubSub } from 'graphql-redis-subscriptions';

export class REDIS {
	private readonly config: Redis.RedisOptions = {
		port: parseInt(process.env.REDIS_PORT as string) || 6379, // Redis port
		host: process.env.REDIS_HOST || '127.0.0.1', // Redis host,
		password: (process.env.REDIS_PASSWORD as string) || '',
	};
	public server = new Redis(this.config);
	public client = new Redis(this.config);
}

export const redisPubSub = new RedisPubSub({
	connection: {
		host: process.env.REDIS_HOST || '127.0.0.1',
		port: 6379,
	},
	publisher: new REDIS().server,
	subscriber: new REDIS().client,
});
