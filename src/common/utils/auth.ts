import { AuthChecker } from 'type-graphql';
import { GQLContext } from './graphql-utils';
import * as jwt from 'jsonwebtoken';
import * as _ from 'lodash';

export const customAuthChecker: AuthChecker<GQLContext> = (
	{ root, args, context: { currentUser }, info },
	roles,
) => {
	// here we can read the user from context
	// and check his permission in the db against the `roles` argument
	// that comes from the `@Authorized` decorator, eg. ["ADMIN", "MODERATOR"]
	console.log(roles);
	return !!currentUser?.userId; // or false if access is denied
};

export const createTokens = async (user, secret, secret2) => {
	const createToken = jwt.sign(
		{
			userId: user.id,
			email: user.email,
		},
		secret,
		{
			expiresIn: 60 * 60 * 24 * 3,
		},
	);

	const createRefreshToken = jwt.sign(
		{
			userId: user.id,
			email: user.email,
		},
		secret2,
		{
			expiresIn: 60 * 60 * 24 * 10,
		},
	);

	return Promise.all([createToken, createRefreshToken]);
};
