import * as Redis from 'ioredis';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import 'dotenv/config';
export class REDIS {
	private readonly config: Redis.RedisOptions = {
		port: parseInt(process.env.REDIS_PORT as any) || 6379, // Redis port
		host: process.env.REDIS_HOST || 'redis', // Redis host,
		password: process.env.REDIS_PASSWORD || '',
	};
	public server = new Redis(this.config);
	public client = new Redis(this.config);
}

export const redisPubSub = new RedisPubSub({
	connection: {
		host: process.env.REDIS_HOST || 'redis',
		port: parseInt(process.env.REDIS_PORT as any) || 6379,
	},
	publisher: new REDIS().server,
	subscriber: new REDIS().client,
});
