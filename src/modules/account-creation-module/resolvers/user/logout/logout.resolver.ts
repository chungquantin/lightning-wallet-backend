import { Resolver, Mutation, Ctx, UseMiddleware } from 'type-graphql';
import { User } from '../../../entity';
import { GQLContext } from '../../../../../utils/graphql-utils';
import { isAuth } from '../../../../../middleware/isAuth';
import {
	REDIS_TOKEN_PREFIX,
	USER_TOKEN_ID_PREFIX,
} from '../../../../../constants/global-variables';
import { ApiResponse } from '../../../../../shared/Response.type';
import { CustomMessage } from '../../../../../shared/CustomMessage.enum';

const ApiLogoutResponse = ApiResponse<String>('Logout', String);
type ApiLogoutResponseType = InstanceType<typeof ApiLogoutResponse>;
@Resolver((of) => User)
class LogoutResolver {
	@UseMiddleware(isAuth)
	@Mutation(() => ApiLogoutResponse, { nullable: true })
	async logout(
		@Ctx() { currentUser, redis }: GQLContext,
	): Promise<ApiLogoutResponseType> {
		const sessionIds = await redis.lrange(
			`${USER_TOKEN_ID_PREFIX}${currentUser.userId}`,
			0,
			-1,
		);
		const promises: Promise<any>[] = [];
		for (let i = 0; i < sessionIds.length; i++) {
			promises.push(
				redis.del(`${REDIS_TOKEN_PREFIX}${sessionIds[i]}`),
			);
		}
		await Promise.all(promises);

		return {
			success: false,
			errors: [
				{
					path: 'currentUser',
					message: CustomMessage.userHasNotLoggedIn,
				},
			],
		};
	}
}

export default LogoutResolver;
