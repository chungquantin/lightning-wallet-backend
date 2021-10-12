import { Resolver, Ctx, UseMiddleware, Query } from "type-graphql";
import { User } from "../../../entity/User";
import { UserRepository } from "../../../repository/user/UserRepository";
import { InjectRepository } from "typeorm-typedi-extensions";
import { GQLContext } from "neutronpay-wallet-common/dist/utils/graphql-utils";
import { isAuth } from "neutronpay-wallet-common/dist/middleware/isAuth";
import {
  ApiResponse,
  CustomMessage
} from "neutronpay-wallet-common/dist/shared";
import { Service } from "typedi";

export const ApiGetCurrentUserResponse = ApiResponse<User>("Me", User);
export type ApiGetCurrentUserResponseType = InstanceType<
  typeof ApiGetCurrentUserResponse
>;

@Service()
@Resolver(() => User)
class GetCurrentUserResolver {
  @InjectRepository(UserRepository)
  private readonly userRepository: UserRepository;

  @UseMiddleware(isAuth)
  @Query(() => ApiGetCurrentUserResponse!, { nullable: true })
  async getCurrentUser(
    @Ctx() { currentUser }: GQLContext
  ): Promise<ApiGetCurrentUserResponseType> {
    const user = await this.userRepository.findOne({
      where: { id: currentUser?.userId }
    });

    if (!user) {
      return {
        success: false,
        errors: [
          {
            path: "userId",
            message: CustomMessage.userIsNotFound
          }
        ]
      };
    }
    return {
      success: true,
      data: user
    };
  }
}

export default GetCurrentUserResolver;
