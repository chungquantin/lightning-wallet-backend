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
import { yupValidateMiddleware } from '../../../../../common/middleware/yupValidate';
import { CustomMessage } from '../../../../../common/shared/CustomMessage.enum';
import { YUP_REGISTER } from './register.validate';
import { GQLContext } from '../../../../../common/utils/graphql-utils';
import { ApiResponse } from '../../../../../common/shared';
import { QUEUE } from '../../../../../common/constants/global-variables';

export const ApiRegisterResponse = ApiResponse<User>(
	'Register',
	User,
);
export type ApiRegisterResponseType = InstanceType<
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
		@Ctx() { channel }: GQLContext,
	): Promise<ApiRegisterResponseType> {
		try {
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
				!!(await this.userRepository.findByPhoneNumber(
					dto.phoneNumber,
				))
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

			channel.sendToQueue(
				QUEUE.ACCOUNT_CREATED,
				Buffer.from(user.id),
			);

			// TODO Disable for now
			// const link =
			//	await new NodeMailerService().createConfirmedEmailLink(
			//		env(EnvironmentType.PROD)
			//			? process.env.PROD_SERVER_HOST
			//			: (process.env.TEST_HOST as any),
			//		user.id,
			//		context.redis,
			//	);

			//await new NodeMailerService().sendEmail(
			//	user.email,
			//	'Ramen | Email Verification',
			//	link,
			//);

			return {
				success: true,
				data: user,
			};
		} catch (err) {
			return {
				success: false,
				errors: [
					{
						path: 'register',
						message: err.message,
					},
				],
			};
		}
	}
}

export default RegisterResolver;
