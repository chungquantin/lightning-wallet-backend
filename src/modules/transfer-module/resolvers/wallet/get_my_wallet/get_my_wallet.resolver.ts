import { Resolver, Query, UseMiddleware, Ctx } from "type-graphql";
import { InjectRepository } from "typeorm-typedi-extensions";
import { WalletRepository } from "../../../repository/WalletRepository";
import {
  ApiResponse,
  CustomMessage,
} from "neutronpay-wallet-common/dist/shared";
import { GQLContext } from "neutronpay-wallet-common/dist/utils/graphql-utils";
import { Wallet } from "../../../entity";
import { Service } from "typedi";
import { isAuth } from "neutronpay-wallet-common/dist/middleware";

export const ApiGetMyWallet = ApiResponse<Wallet>("GetMeWallet", Wallet);
export type ApiGetMyWalletType = InstanceType<typeof ApiGetMyWallet>;

@Service()
@Resolver(() => Wallet)
class GetMyWalletResolver {
  @InjectRepository(WalletRepository)
  private readonly walletRepository: WalletRepository;

  @UseMiddleware(isAuth)
  @Query(() => ApiGetMyWallet, { nullable: true })
  async getMyWallet(
    @Ctx() { currentUser }: GQLContext
  ): Promise<ApiGetMyWalletType> {
    const wallet = await this.walletRepository.findOne({
      where: {
        userId: currentUser?.userId,
      },
    });
    if (!wallet) {
      return {
        success: false,
        errors: [
          {
            path: "userId",
            message: CustomMessage.walletIsNotFound,
          },
        ],
      };
    }
    return {
      success: true,
      data: wallet,
    };
  }
}

export default GetMyWalletResolver;
