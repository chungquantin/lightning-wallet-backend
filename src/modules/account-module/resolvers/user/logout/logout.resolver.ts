import { Resolver, Mutation, Ctx, UseMiddleware } from 'type-graphql';
import { User } from '../../../entity';
import { GQLContext } from '../../../../../common/utils/graphql-utils';
import { isAuth } from '../../../../../common/middleware/isAuth';
import {
	REDIS_ACCESS_TOKEN_PREFIX,
	REDIS_REFRESH_TOKEN_PREFIX,
	USER_TOKEN_ID_PREFIX,
} from '../../../../../common/constants/global-variables';
import { ApiResponse } from '../../../../../common/shared/Response.type';
import { CustomMessage } from '../../../../../common/shared/CustomMessage.enum';

export const ApiLogoutResponse = ApiResponse<String>(
	'Logout',
	String,
);
export type ApiLogoutResponseType = InstanceType<
	typeof ApiLogoutResponse
>;
@Resolver((of) => User)
class LogoutResolver {
	@UseMiddleware(isAuth)
	@Mutation(() => ApiLogoutResponse, { nullable: true })
	async logout(
		@Ctx() { currentUser, redis }: GQLContext,
	): Promise<ApiLogoutResponseType> {
		if (!currentUser) {
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
		const sessionIds = await redis.lrange(
			`${USER_TOKEN_ID_PREFIX}${currentUser?.userId}`,
			0,
			-1,
		);
		const promises: Promise<any>[] = [];
		for (let i = 0; i < sessionIds.length; i++) {
			promises.push(
				...[
					redis.del(`${REDIS_ACCESS_TOKEN_PREFIX}${sessionIds[i]}`),
					redis.del(`${REDIS_REFRESH_TOKEN_PREFIX}${sessionIds[i]}`),
				],
			);
		}
		await Promise.all(promises);

		return {
			success: true,
		};
	}
}

export default LogoutResolver;
