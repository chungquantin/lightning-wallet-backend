import { Arg, Resolver, Query } from "type-graphql";
import { InjectRepository } from "typeorm-typedi-extensions";
import { UserRepository } from "../../../repository/user/UserRepository";
import { SearchUserDto } from "./search_user.dto";
import { User } from "../../../entity/User";
import {
  ApiResponse,
  CustomMessage,
} from "neutronpay-wallet-common/dist/shared";
import { Service } from "typedi";

export const ApiUserResponse = ApiResponse<User>("SearchUser", User);
export type ApiUserResponseType = InstanceType<typeof ApiUserResponse>;

@Service()
@Resolver(() => User)
class GetUserResolver {
  @InjectRepository(UserRepository)
  private readonly userRepository: UserRepository;

  @Query(() => ApiUserResponse, { nullable: true })
  async searchUser(
    @Arg("data") { searchInput }: SearchUserDto
  ): Promise<ApiUserResponseType> {
    const user = await this.userRepository.findOne({
      where: [
        {
          email: searchInput,
        },
        {
          username: searchInput,
        },
        {
          phoneNumber: searchInput,
        },
      ],
    });

    if (!user) {
      return {
        success: false,
        errors: [
          {
            path: "searchInput",
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
