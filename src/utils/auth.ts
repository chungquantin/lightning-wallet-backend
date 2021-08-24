import { AuthChecker } from 'type-graphql';
import { GQLContext } from './graphql-utils';
import * as jwt from 'jsonwebtoken';
import * as _ from 'lodash';
import { UserRepository } from '../modules/account-creation-module/repository';

export const customAuthChecker: AuthChecker<GQLContext> = (
	{ root, args, context: { currentUser }, info },
	roles,
) => {
	// here we can read the user from context
	// and check his permission in the db against the `roles` argument
	// that comes from the `@Authorized` decorator, eg. ["ADMIN", "MODERATOR"]
	console.log(roles);
	return !!currentUser.userId; // or false if access is denied
};

export const createTokens = async (user, secret, secret2) => {
	const createToken = jwt.sign(
		{
			userId: user.id,
			email: user.email,
		},
		secret,
		{
			expiresIn: '3d',
		},
	);

	const createRefreshToken = jwt.sign(
		{
			userId: user.id,
			email: user.email,
		},
		secret2,
		{
			expiresIn: '14d',
		},
	);

	return Promise.all([createToken, createRefreshToken]);
};

export const refreshTokens = async (
	token,
	refreshToken,
	SECRET,
	SECRET_2,
) => {
	try {
		const { userId } = jwt.decode(refreshToken);
		if (!userId) {
			return {};
		}

		const user = await new UserRepository().findOne({
			where: { id: userId },
		});

		if (!user) {
			return {};
		}

		const refreshSecret = SECRET_2 + user.password;

		try {
			jwt.verify(refreshToken, refreshSecret);
		} catch (err) {
			return {};
		}

		const [newToken, newRefreshToken] = await createTokens(
			user,
			SECRET,
			refreshSecret,
		);
		return {
			token: newToken,
			refreshToken: newRefreshToken,
			user,
		};
	} catch (err) {
		return {};
	}
};
