import { Resolver, Mutation, Ctx, UseMiddleware } from 'type-graphql';
import { User } from '../../../../entity';
import { GQLContext } from '../../../../utils/graphql-utils';
import { isAuth } from '../../../middleware/isAuth';
import {
	REDIS_SESSION_PREFIX,
	USER_SESSION_ID_PREFIX,
} from '../../../../constants/global-variables';
import { ApiResponse } from '../../../../shared/Response.type';
import { CustomMessage } from '../../../../shared/CustomMessage.enum';

const ApiLogoutResponse = ApiResponse<String>('Logout', String);
type ApiLogoutResponseType = InstanceType<typeof ApiLogoutResponse>;
@Resolver((of) => User)
class LogoutResolver {
	@UseMiddleware(isAuth)
	@Mutation(() => ApiLogoutResponse, { nullable: true })
	async logout(
		@Ctx() { session, redis }: GQLContext,
	): Promise<ApiLogoutResponseType> {
		const sessionIds = await redis.lrange(
			`${USER_SESSION_ID_PREFIX}${session.userId}`,
			0,
			-1,
		);
		const promises: Promise<any>[] = [];
		for (let i = 0; i < sessionIds.length; i++) {
			promises.push(
				redis.del(`${REDIS_SESSION_PREFIX}${sessionIds[i]}`),
			);
		}
		await Promise.all(promises);

		if (session) {
			session.destroy((err: any) => {
				if (err) {
					return {
						success: false,
						errors: [
							{
								path: 'session',
								message: err.message,
							},
						],
					};
				}
				return {
					success: true,
				};
			});
		}
		return {
			success: false,
			errors: [
				{
					path: 'session',
					message: CustomMessage.userHasNotLoggedIn,
				},
			],
		};
	}
}

export default LogoutResolver;
