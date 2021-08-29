import {
	Resolver,
	Ctx,
	UseMiddleware,
	Query,
	Arg,
} from 'type-graphql';
import { User } from '../../../entity/User';
import { UserRepository } from '../../../repository/user/UserRepository';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { GQLContext } from '../../../../../common/utils/graphql-utils';
import { isAuth } from '../../../../../common/middleware/isAuth';
import {
	ApiArrayResponse,
	CustomMessage,
} from '../../../../../common/shared';
import { PaginationInputType } from '../../../../../common/shared/Pagination';

export const ApiGetMyContactsResponse = ApiArrayResponse<User>(
	'GetMyContacts',
	User,
);
export type ApiGetMyContactsResponseType = InstanceType<
	typeof ApiGetMyContactsResponse
>;

@Resolver((of) => User)
class GetMyContactResolver {
	@InjectRepository(UserRepository)
	private readonly userRepository: UserRepository;

	@UseMiddleware(isAuth)
	@Query(() => ApiGetMyContactsResponse!, { nullable: true })
	async getMyContacts(
		@Ctx() { currentUser }: GQLContext,
		@Arg('Pagination', { nullable: true })
		Pagination?: PaginationInputType,
	): Promise<ApiGetMyContactsResponseType> {
		const user = await this.userRepository.findOne({
			where: { id: currentUser?.userId },
			relations: ['contacts'],
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
				data: [],
			};
		}

		const contacts = user.contacts;

		return {
			success: true,
			data:
				contacts.slice(
					Pagination?.skip,
					Pagination?.limit === 0
						? contacts.length
						: Pagination?.limit,
				) || [],
		};
	}
}

export default GetMyContactResolver;
