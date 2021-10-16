import { Arg, Resolver, Mutation, UseMiddleware, Ctx } from "type-graphql";
import { User } from "../../../entity/User";
import { RegisterDto } from "./register.dto";
import { UserRepository } from "../../../repository/user/UserRepository";
import { InjectRepository } from "typeorm-typedi-extensions";
import { yupValidateMiddleware } from "neutronpay-wallet-common/dist/middleware/yupValidate";
import { YUP_REGISTER } from "./register.validate";
import { GQLContext } from "neutronpay-wallet-common/dist/utils/graphql-utils";
import {
  ApiResponse,
  CustomMessage,
} from "neutronpay-wallet-common/dist/shared";
import { mqProduce } from "../../../queue";
import { Queue } from "neutronpay-wallet-common/dist/constants/queue";
import { Service } from "typedi";

export const ApiRegisterResponse = ApiResponse<User>("Register", User);
export type ApiRegisterResponseType = InstanceType<typeof ApiRegisterResponse>;

@Service()
@Resolver(() => User)
class RegisterResolver {
  @InjectRepository(UserRepository)
  private readonly userRepository: UserRepository;

  @UseMiddleware(yupValidateMiddleware(YUP_REGISTER))
  @Mutation(() => ApiRegisterResponse!, { nullable: true })
  async register(
    @Arg("data") dto: RegisterDto,
    @Ctx() { channel }: GQLContext
  ): Promise<ApiRegisterResponseType> {
    try {
      if (!!(await this.userRepository.findByEmail(dto.email))) {
        return {
          success: false,
          errors: [
            {
              path: "email",
              message: CustomMessage.emailIsRegister,
            },
          ],
        };
      }

      if (!!(await this.userRepository.findByPhoneNumber(dto.phoneNumber))) {
        return {
          success: false,
          errors: [
            {
              path: "phoneNumber",
              message: CustomMessage.phoneNumberIsTaken,
            },
          ],
        };
      }

      const user = await this.userRepository.create(dto).save();

      mqProduce<"new_account_created">(channel, Queue.TRANSFER_QUEUE, {
        data: {
          userId: user.id,
        },
        operation: "new_account_created",
      });

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
            path: "register",
            message: err.message,
          },
        ],
      };
    }
  }
}

export default RegisterResolver;
