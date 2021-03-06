import { Arg, Resolver, Mutation, UseMiddleware, Ctx } from "type-graphql";
import { InjectRepository } from "typeorm-typedi-extensions";
import { UserRepository } from "../../../repository/user/UserRepository";
import { User } from "../../../entity/User";
import { SendForgotPasswordDto } from "./send_forgot_password_email.dto";
import { yupValidateMiddleware } from "neutronpay-wallet-common/dist/middleware";
import {
  ApiResponse,
  CustomMessage
} from "neutronpay-wallet-common/dist/shared";
import { forgotPasswordLockAccount } from "../../../utils/forgotPasswordLock";
import { GQLContext } from "neutronpay-wallet-common/dist/utils/graphql-utils";
import { YUP_SEND_FORGOT_PASSWORD_EMAIL } from "./send_forgot_password_email.validate";
import { ForgotPasswordChangeDto } from "./forgot_password_change.dto";
import { YUP_CHANGE_PASSWORD } from "./forgot_password_change.validate";
import { FORGOT_PASSWORD_PREFIX } from "neutronpay-wallet-common/dist/constants/global-variables";
import * as bcrypt from "bcryptjs";
import { Service } from "typedi";
import "dotenv/config";

export const ApiForgotPasswordResponse = ApiResponse<String>(
  "ForgotPassword",
  String
);
export type ApiForgotPasswordResponseType = InstanceType<
  typeof ApiForgotPasswordResponse
>;

const ApiSendForgotPasswordResponse = ApiResponse<String>(
  "SendForgotPassword",
  String
);
type ApiSendForgotPasswordResponseType = InstanceType<
  typeof ApiForgotPasswordResponse
>;

@Service()
@Resolver(() => User)
class ForgotPasswordResolver {
  @InjectRepository(UserRepository)
  private readonly userRepository: UserRepository;

  @UseMiddleware(yupValidateMiddleware(YUP_SEND_FORGOT_PASSWORD_EMAIL))
  @Mutation(() => ApiForgotPasswordResponse!, { nullable: true })
  async sendForgotPasswordEmail(
    @Arg("data") { email }: SendForgotPasswordDto,
    @Ctx() {}: GQLContext
  ): Promise<ApiForgotPasswordResponseType> {
    const user = await this.userRepository.findOne({
      where: { email }
    });
    if (!user) {
      return {
        success: false,
        errors: [
          {
            path: "email",
            message: CustomMessage.userIsNotFound
          }
        ]
      };
    }

    await forgotPasswordLockAccount(user.id);
    // TODO Replace with Mailgun
    // Send reset password link to email
    //const link =
    //	await new NodeMailerService().createForgotPasswordLink(
    //		env(EnvironmentType.PROD)
    //			? process.env.PROD_SERVER_HOST
    //			: (process.env.TEST_HOST as any),
    //		user.id,
    //		redis,
    //	);

    //await new NodeMailerService().sendEmail(
    //	email,
    //	'Ramen | Forgot Password',
    //	link,
    //);

    return {
      success: true
    };
  }

  @UseMiddleware(yupValidateMiddleware(YUP_CHANGE_PASSWORD))
  @Mutation(() => ApiSendForgotPasswordResponse!, { nullable: true })
  async forgotPasswordChange(
    @Arg("data") { key, newPassword }: ForgotPasswordChangeDto,
    @Ctx() { redis }: GQLContext
  ): Promise<ApiSendForgotPasswordResponseType> {
    const userId = await redis.get(`${FORGOT_PASSWORD_PREFIX}${key}`);
    if (!userId) {
      return {
        success: false,
        errors: [
          {
            path: "key",
            message: CustomMessage.expiredKeyError
          }
        ]
      };
    }
    await this.userRepository.update(
      { id: userId as string },
      {
        password: await bcrypt.hash(newPassword, 10),
        forgotPasswordLock: false
      }
    );

    return {
      success: true
    };
  }
}

export default ForgotPasswordResolver;
