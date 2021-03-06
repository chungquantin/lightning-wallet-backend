import {
  Arg,
  Resolver,
  Mutation,
  Ctx,
  UseMiddleware,
  ObjectType,
  Field
} from "type-graphql";
import { User } from "../../../entity";
import { LoginDto } from "./login.dto";
import { UserRepository } from "../../../repository/user/UserRepository";
import { InjectRepository } from "typeorm-typedi-extensions";
import * as bcrypt from "bcryptjs";
import { GQLContext } from "neutronpay-wallet-common/dist/utils/graphql-utils";
import {
  REDIS_ACCESS_TOKEN_PREFIX,
  REDIS_REFRESH_TOKEN_PREFIX
} from "neutronpay-wallet-common/dist/constants/global-variables";
import { yupValidateMiddleware } from "neutronpay-wallet-common/dist/middleware/yupValidate";
import {
  ApiResponse,
  CustomMessage
} from "neutronpay-wallet-common/dist/shared";
import { YUP_LOGIN } from "./login.validate";
import { createTokens } from "neutronpay-wallet-common/dist/utils/auth";
import {
  env,
  EnvironmentType
} from "neutronpay-wallet-common/dist/utils/environmentType";
import { Service } from "typedi";

@ObjectType()
class TokenResponse {
  @Field()
  accessToken: String;

  @Field()
  refreshToken: String;
}

export const ApiLoginResponse = ApiResponse<TokenResponse>(
  "Login",
  TokenResponse
);
export type ApiLoginResponseType = InstanceType<typeof ApiLoginResponse>;

@Service()
@Resolver(() => User)
class LoginResolver {
  @InjectRepository(UserRepository)
  private readonly userRepository: UserRepository;

  @UseMiddleware(yupValidateMiddleware(YUP_LOGIN))
  @Mutation(() => ApiLoginResponse, { nullable: true })
  async login(
    @Arg("data") { email, password }: LoginDto,
    @Ctx() { redis, currentUser }: GQLContext
  ): Promise<ApiLoginResponseType> {
    try {
      let user = await this.userRepository.findByEmail(email);

      if (!user) {
        return {
          success: false,
          errors: [
            {
              path: "email",
              message: CustomMessage.accountIsNotRegister
            }
          ]
        };
      }

      user = user as User;

      if (!env(EnvironmentType.DEV) && !user.emailVerified) {
        return {
          success: false,
          errors: [
            {
              path: "emailVerified",
              message: CustomMessage.userEmailIsNotVerified
            }
          ]
        };
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return {
          success: false,
          errors: [
            {
              path: "password",
              message: CustomMessage.passwordIsNotMatch
            }
          ]
        };
      }

      if (currentUser) {
        return {
          success: false,
          errors: [
            {
              path: "login",
              message: CustomMessage.userHasLoggedIn
            }
          ]
        };
      }

      const [accessToken, refreshToken] = await createTokens(
        user,
        process.env.TOKEN_KEY,
        process.env.REFRESH_TOKEN_KEY
      );

      if (accessToken && refreshToken) {
        await redis.set(
          `${REDIS_ACCESS_TOKEN_PREFIX}${user.id}`,
          accessToken,
          "ex",
          60 * 60 * 24 * 3
        );
        await redis.set(
          `${REDIS_REFRESH_TOKEN_PREFIX}${user.id}`,
          accessToken,
          "ex",
          60 * 60 * 24 * 10
        );
      }

      const response = {
        success: true,
        data: { accessToken, refreshToken }
      };
      console.log("[LoginResolver]-", response);
      return response;
    } catch (err) {
      return {
        success: false,
        errors: [
          {
            path: "login",
            message: err.message
          }
        ]
      };
    }
  }
}

export default LoginResolver;
