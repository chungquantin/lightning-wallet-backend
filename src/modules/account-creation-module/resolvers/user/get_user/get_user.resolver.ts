import { Arg, Resolver, Query, UseMiddleware } from 'type-graphql';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { yupValidateMiddleware } from '../../../../../middleware/yupValidate';
import { UserRepository } from '../../../repository/user/UserRepository';
import { GetUserDto } from './get_user.dto';
import { User } from '../../../entity/User';
import { YUP_USER_READ } from './get_user.validate';
import { ApiResponse, CustomMessage } from '../../../../../shared';

export const ApiUserResponse = ApiResponse<User>('GetUser', User);
export type ApiUserResponseType = InstanceType<typeof ApiUserResponse>;

@Resolver((of) => User)
class GetUserResolver {
	@InjectRepository(UserRepository)
	private readonly userRepository: UserRepository;

	@UseMiddleware(yupValidateMiddleware(YUP_USER_READ))
	@Query(() => ApiUserResponse, { nullable: true })
	async getUser(
		@Arg('data') { userId }: GetUserDto,
	): Promise<ApiUserResponseType> {
		const user = await this.userRepository.findOne({
			where: {
				id: userId,
			},
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

export default GetUserResolver;
