import {
	Arg,
	Resolver,
	Mutation,
	Ctx,
	UseMiddleware,
	ObjectType,
	Field,
} from 'type-graphql';
import { User } from '../../../entity';
import { LoginDto } from './login.dto';
import { UserRepository } from '../../../repository/user/UserRepository';
import { InjectRepository } from 'typeorm-typedi-extensions';
import * as bcrypt from 'bcrypt';
import { GQLContext } from '../../../../../common/utils/graphql-utils';
import {
	REDIS_ACCESS_TOKEN_PREFIX,
	REDIS_REFRESH_TOKEN_PREFIX,
} from '../../../../../common/constants/global-variables';
import { yupValidateMiddleware } from '../../../../../common/middleware/yupValidate';
import { ApiResponse, CustomMessage } from '../../../../../common/shared';
import { YUP_LOGIN } from './login.validate';
import { createTokens } from '../../../../../common/utils/auth';
import {
	env,
	EnvironmentType,
} from '../../../../../common/utils/environmentType';

@ObjectType()
class TokenResponse {
	@Field()
	accessToken: String;

	@Field()
	refreshToken: String;
}

export const ApiLoginResponse = ApiResponse<TokenResponse>(
	'Login',
	TokenResponse,
);
export type ApiLoginResponseType = InstanceType<
	typeof ApiLoginResponse
>;

@Resolver((of) => User)
class LoginResolver {
	@InjectRepository(UserRepository)
	private readonly userRepository: UserRepository;

	@UseMiddleware(yupValidateMiddleware(YUP_LOGIN))
	@Mutation(() => ApiLoginResponse, { nullable: true })
	async login(
		@Arg('data') { email, password }: LoginDto,
		@Ctx() { redis, currentUser }: GQLContext,
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

		if (!env(EnvironmentType.DEV) || !user.emailVerified) {
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

		if (currentUser) {
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

		const [accessToken, refreshToken] = await createTokens(
			user,
			process.env.TOKEN_KEY,
			process.env.REFRESH_TOKEN_KEY,
		);

		if (accessToken && refreshToken) {
			await redis.set(
				`${REDIS_ACCESS_TOKEN_PREFIX}${user.id}`,
				accessToken,
				'ex',
				60 * 60 * 24 * 3,
			);
			await redis.set(
				`${REDIS_REFRESH_TOKEN_PREFIX}${user.id}`,
				accessToken,
				'ex',
				60 * 60 * 24 * 10,
			);
		}

		return {
			success: true,
			data: { accessToken, refreshToken },
		};
	}
}

export default LoginResolver;
