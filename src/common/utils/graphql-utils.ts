import { Channel } from 'amqplib';
import { Request } from 'express';
import { Redis } from 'ioredis';

export interface GQLDataMapper {
	context: GQLContext;
	root: any;
	info: any;
	args: any;
}

export interface CurrentUser {
	userId: string;
	email: string;
}

export type GQLContext = {
	request: Request;
	currentUser: CurrentUser | null;
	channel: Channel;
	url: string;
	redis: Redis;
};
