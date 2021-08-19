import {
	Arg,
	Resolver,
	Mutation,
	Ctx,
	UseMiddleware,
} from 'type-graphql';
import { User } from '../../../../entity';
import { LoginDto } from './login.dto';
import { UserRepository } from '../../../repository/user/UserRepository';
import { InjectRepository } from 'typeorm-typedi-extensions';
import * as bcrypt from 'bcrypt';
import { GQLContext } from '../../../../utils/graphql-utils';
import { USER_SESSION_ID_PREFIX } from '../../../../constants/global-variables';
import { yupValidateMiddleware } from '../../../middleware/yupValidate';
import { ApiResponse, CustomMessage } from '../../../../shared';
import { YUP_LOGIN } from './login.validate';

const ApiLoginResponse = ApiResponse<String>('Login', String);
type ApiLoginResponseType = InstanceType<typeof ApiLoginResponse>;

@Resolver((of) => User)
class LoginResolver {
	@InjectRepository(UserRepository)
	private readonly userRepository: UserRepository;

	@UseMiddleware(yupValidateMiddleware(YUP_LOGIN))
	@Mutation(() => ApiLoginResponse, { nullable: true })
	async login(
		@Arg('data') { email, password }: LoginDto,
		@Ctx() { request, session, redis }: GQLContext,
	): Promise<ApiLoginResponseType> {
		let user = await this.userRepository.findByEmail(email);

		if (!user) {
			return {
				success: false,
				errors: [
					{
						path: 'email',
						message: CustomMessage.accountIsNotRegister,
					},
				],
			};
		}

		user = user as User;

		if (!user.emailVerified) {
			return {
				success: false,
				errors: [
					{
						path: 'emailVerified',
						message: CustomMessage.userEmailIsNotVerified,
					},
				],
			};
		}

		const passwordMatch = await bcrypt.compare(
			password,
			user.password,
		);

		if (!passwordMatch) {
			return {
				success: false,
				errors: [
					{
						path: 'password',
						message: CustomMessage.passwordIsNotMatch,
					},
				],
			};
		}

		if (session?.userId) {
			return {
				success: false,
				errors: [
					{
						path: 'login',
						message: CustomMessage.userHasLoggedIn,
					},
				],
			};
		}

		session.userId = user.id;
		if (request?.sessionID) {
			redis.lpush(`${USER_SESSION_ID_PREFIX}${user.id}`, user.id);
		}
		session.save();
		return {
			success: true,
		};
	}
}

export default LoginResolver;
