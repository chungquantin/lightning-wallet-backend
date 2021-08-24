import { AuthenticationError } from 'apollo-server-express';
import { MiddlewareFn } from 'type-graphql';
import { GQLContext } from '../utils/graphql-utils';

export const isAuth: MiddlewareFn<GQLContext> = (
	{ args, context: { currentUser } },
	next,
) => {
	if (!currentUser) {
		throw new AuthenticationError('Not authenticated');
	}
	console.log('Authenticated');
	return next();
};
