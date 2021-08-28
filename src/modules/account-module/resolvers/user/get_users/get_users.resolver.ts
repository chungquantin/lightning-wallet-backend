import { Resolver, Query, UseMiddleware, Arg } from 'type-graphql';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { UserRepository } from '../../../repository/user/UserRepository';
import { User } from '../../../entity';
import { ApiArrayResponse } from '../../../../../common/shared';
import { PaginationInputType } from '../../../../../common/shared/Pagination';

export const ApiUsersResponse = ApiArrayResponse<User>(
	'GetUsers',
	User,
);
export type ApiUsersResponseType = InstanceType<
	typeof ApiUsersResponse
>;

@Resolver((of) => User)
class GetUsersResolver {
	@InjectRepository(UserRepository)
	private readonly userRepository: UserRepository;

	@UseMiddleware()
	@Query(() => ApiUsersResponse, { nullable: true })
	async getUsers(
		@Arg('Pagination', { nullable: true })
		Pagination?: PaginationInputType,
	): Promise<ApiUsersResponseType> {
		const users = await this.userRepository.find({
			relations: ['contacts'],
		});
		return {
			success: true,
			data: users.slice(
				Pagination?.skip,
				Pagination?.limit === 0 ? users.length : Pagination?.limit,
			),
		};
	}
}

export default GetUsersResolver;
