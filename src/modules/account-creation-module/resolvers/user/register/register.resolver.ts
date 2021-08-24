import {
	Arg,
	Resolver,
	Mutation,
	UseMiddleware,
	Ctx,
} from 'type-graphql';
import { User } from '../../../entity/User';
import { RegisterDto } from './register.dto';
import { UserRepository } from '../../../repository/user/UserRepository';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { yupValidateMiddleware } from '../../../../../middleware/yupValidate';
import { CustomMessage } from '../../../../../shared/CustomMessage.enum';
import { YUP_REGISTER } from './register.validate';
import NodeMailerService from '../../../../../helpers/email';
import { GQLContext } from '../../../../../utils/graphql-utils';
import {
	env,
	EnvironmentType,
} from '../../../../../utils/environmentType';
import { ApiResponse } from '../../../../../shared';

const ApiRegisterResponse = ApiResponse<String>('Register', String);
type ApiRegisterResponseType = InstanceType<
	typeof ApiRegisterResponse
>;

@Resolver((of) => User)
class RegisterResolver {
	@InjectRepository(UserRepository)
	private readonly userRepository: UserRepository;

	@UseMiddleware(yupValidateMiddleware(YUP_REGISTER))
	@Mutation(() => ApiRegisterResponse!, { nullable: true })
	async register(
		@Arg('data') dto: RegisterDto,
		@Ctx() { redis }: GQLContext,
	): Promise<ApiRegisterResponseType> {
		if (!!(await this.userRepository.findByEmail(dto.email))) {
			return {
				success: false,
				errors: [
					{
						path: 'email',
						message: CustomMessage.emailIsRegister,
					},
				],
			};
		}

		if (
			!!(await this.userRepository.findByPhoneNumber(dto.phoneNumber))
		) {
			return {
				success: false,
				errors: [
					{
						path: 'phoneNumber',
						message: CustomMessage.phoneNumberIsTaken,
					},
				],
			};
		}

		const user = await this.userRepository.create(dto).save();

		const link =
			await new NodeMailerService().createConfirmedEmailLink(
				env(EnvironmentType.PROD)
					? process.env.PROD_SERVER_HOST
					: (process.env.TEST_HOST as any),
				user.id,
				redis,
			);

		await new NodeMailerService().sendEmail(
			user.email,
			'Ramen | Email Verification',
			link,
		);

		return {
			success: true,
		};
	}
}

export default RegisterResolver;
