import { Resolver, Query, Arg, UseMiddleware, Ctx } from "type-graphql";
import { InjectRepository } from "typeorm-typedi-extensions";
import {
  ApiArrayResponse,
  PaginationInputType,
} from "neutronpay-wallet-common/dist/shared";
import { TransactionRequest } from "../../../entity/TransactionRequest";
import { TransactionRequestRepository } from "../../../repository/TransactionRequestRepository";
import { isAuth } from "neutronpay-wallet-common/dist/middleware";
import { GQLContext } from "neutronpay-wallet-common/dist/utils";
import { WalletRepository } from "../../../repository";
import { CustomMessage } from "../../../constants";
import { Service } from "typedi";

export const ApiGetMyPaymentRequestsResponse =
  ApiArrayResponse<TransactionRequest>(
    "GetMyPaymentRequests",
    TransactionRequest
  );
export type ApiGetMyPaymentRequestsResponseType = InstanceType<
  typeof ApiGetMyPaymentRequestsResponse
>;

@Service()
@Resolver(() => TransactionRequest)
class GetMyPaymentRequestsResolver {
  @InjectRepository(TransactionRequestRepository)
  private readonly transactionRequestRepository: TransactionRequestRepository;

  @InjectRepository(WalletRepository)
  private readonly walletRepository: WalletRepository;

  @UseMiddleware(isAuth)
  @Query(() => ApiGetMyPaymentRequestsResponse, { nullable: true })
  async getMyPaymentRequests(
    @Ctx() { currentUser }: GQLContext,
    @Arg("Pagination", { nullable: true })
    Pagination?: PaginationInputType
  ): Promise<ApiGetMyPaymentRequestsResponseType> {
    const wallet = await this.walletRepository.findOne({
      where: {
        userId: currentUser?.userId,
      },
    });

    if (!wallet) {
      return {
        success: false,
        data: [],
        errors: [
          {
            path: "currentUser",
            message: CustomMessage.walletIsNotFound,
          },
        ],
      };
    }
    const transactionRequests = await this.transactionRequestRepository.find({
      where: [
        {
          requestTo: wallet.id,
        },
        {
          requestFrom: wallet.id,
        },
      ],
      relations: ["transaction"],
    });

    return {
      success: true,
      data: transactionRequests.slice(
        Pagination?.skip,
        Pagination?.limit === 0 ? transactionRequests.length : Pagination?.limit
      ),
    };
  }
}

export default GetMyPaymentRequestsResolver;
