import { Resolver, Ctx, UseMiddleware, Query } from 'type-graphql';
import { User } from '../../../entity/User';
import { UserRepository } from '../../../repository/user/UserRepository';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { GQLContext } from '../../../../../common/utils/graphql-utils';
import { isAuth } from '../../../../../common/middleware/isAuth';
import { ApiResponse, CustomMessage } from '../../../../../common/shared';

export const ApiMeResponse = ApiResponse<User>('Me', User);
export type ApiMeResponseType = InstanceType<typeof ApiMeResponse>;

@Resolver((of) => User)
class MeResolver {
	@InjectRepository(UserRepository)
	private readonly userRepository: UserRepository;

	@UseMiddleware(isAuth)
	@Query(() => ApiMeResponse!, { nullable: true })
	async me(
		@Ctx() { currentUser }: GQLContext,
	): Promise<ApiMeResponseType> {
		const user = await this.userRepository.findOne({
			where: { id: currentUser?.userId },
		});
		
		if (!user) {
			return {
				success: false,
				errors: [
					{
						path: 'userId',
						message: CustomMessage.userIsNotFound,
					},
				],
			};
		}
		return {
			success: true,
			data: user,
		};
	}
}

export default MeResolver;