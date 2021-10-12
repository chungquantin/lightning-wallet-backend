import { Resolver, Ctx, UseMiddleware, Query, Arg } from "type-graphql";
import { User } from "../../../entity/User";
import { UserRepository } from "../../../repository/user/UserRepository";
import { InjectRepository } from "typeorm-typedi-extensions";
import { GQLContext } from "neutronpay-wallet-common/dist/utils/graphql-utils";
import { isAuth } from "neutronpay-wallet-common/dist/middleware/isAuth";
import {
  ApiArrayResponse,
  PaginationInputType,
  CustomMessage
} from "neutronpay-wallet-common/dist/shared";
import { Service } from "typedi";

export const ApiGetMyContactsResponse = ApiArrayResponse<User>(
  "GetMyContacts",
  User
);
export type ApiGetMyContactsResponseType = InstanceType<
  typeof ApiGetMyContactsResponse
>;

@Service()
@Resolver(() => User)
class GetMyContactResolver {
  @InjectRepository(UserRepository)
  private readonly userRepository: UserRepository;

  @UseMiddleware(isAuth)
  @Query(() => ApiGetMyContactsResponse!, { nullable: true })
  async getMyContacts(
    @Ctx() { currentUser }: GQLContext,
    @Arg("Pagination", { nullable: true })
    Pagination?: PaginationInputType
  ): Promise<ApiGetMyContactsResponseType> {
    const user = await this.userRepository.findOne({
      where: { id: currentUser?.userId },
      relations: ["contacts"]
    });

    if (!user) {
      return {
        success: false,
        errors: [
          {
            path: "userId",
            message: CustomMessage.userIsNotFound
          }
        ],
        data: []
      };
    }

    const contacts = user.contacts;

    return {
      success: true,
      data:
        contacts.slice(
          Pagination?.skip,
          Pagination?.limit === 0 ? contacts.length : Pagination?.limit
        ) || []
    };
  }
}

export default GetMyContactResolver;
