import { Resolver, Ctx, UseMiddleware, Query } from 'type-graphql';
import { User } from '../../../entity/User';
import { UserRepository } from '../../../repository/user/UserRepository';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { GQLContext } from '../../../../../utils/graphql-utils';
import { isAuth } from '../../../../../middleware/isAuth';
import { ApiResponse, CustomMessage } from '../../../../../shared';

const ApiMeResponse = ApiResponse<User>('Me', User);
type ApiMeResponseType = InstanceType<typeof ApiMeResponse>;

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
			where: { id: currentUser.userId },
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
