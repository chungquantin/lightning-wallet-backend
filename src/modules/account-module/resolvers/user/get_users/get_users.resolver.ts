import { Resolver, Query, UseMiddleware } from 'type-graphql';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { UserRepository } from '../../../repository/user/UserRepository';
import { User } from '../../../entity';
import { ApiArrayResponse } from '../../../../../common/shared';

export const ApiUsersResponse = ApiArrayResponse<User>('GetUsers', User);
export type ApiUsersResponseType = InstanceType<typeof ApiUsersResponse>;

@Resolver((of) => User)
class GetUsersResolver {
	@InjectRepository(UserRepository)
	private readonly userRepository: UserRepository;

	@UseMiddleware()
	@Query(() => ApiUsersResponse, { nullable: true })
	async getUsers(): Promise<ApiUsersResponseType> {
		const users = await this.userRepository.find();
		return {
			success: true,
			data: users,
		};
	}
}

export default GetUsersResolver;
