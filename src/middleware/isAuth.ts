import { AuthenticationError } from 'apollo-server-express';
import { MiddlewareFn } from 'type-graphql';
import { logger } from '../config/winston.config';
import { GQLContext } from '../utils/graphql-utils';

export const isAuth: MiddlewareFn<GQLContext> = (
	{ args, context: { session } },
	next,
) => {
	logger.info(session);
	if (!session.userId) {
		throw new AuthenticationError('Not authenticated');
	}
	console.log('Authenticated');
	return next();
};
