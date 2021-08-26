import { Channel } from 'amqplib';
import { Request } from 'express';
import { Session } from 'express-session';
import { Redis } from 'ioredis';

declare module 'express-session' {
	export interface SessionData {
		cookie: Cookie;
		userId: string;
	}
}

export interface GQLDataMapper {
	context: GQLContext;
	root: any;
	info: any;
	args: any;
}

export interface SessionStorage extends Session {
	userId?: string;
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
