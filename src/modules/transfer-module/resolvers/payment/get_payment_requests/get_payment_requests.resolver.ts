import { Resolver, Query, Arg } from "type-graphql";
import { InjectRepository } from "typeorm-typedi-extensions";
import {
  ApiArrayResponse,
  PaginationInputType
} from "neutronpay-wallet-common/dist/shared";
import { Wallet } from "../../../entity";
import { TransactionRequest } from "../../../entity/TransactionRequest";
import { TransactionRequestRepository } from "../../../repository/TransactionRequestRepository";
import { Service } from "typedi";

export const ApiGetPaymentRequestsResponse = ApiArrayResponse<
  TransactionRequest
>("GetPaymentRequests", TransactionRequest);
export type ApiGetPaymentRequestsResponseType = InstanceType<
  typeof ApiGetPaymentRequestsResponse
>;

@Service()
@Resolver(() => Wallet)
class GetPaymentRequestsResolver {
  @InjectRepository(TransactionRequestRepository)
  private readonly transactionRequestRepository: TransactionRequestRepository;

  @Query(() => ApiGetPaymentRequestsResponse, { nullable: true })
  async getPaymentRequests(
    @Arg("Pagination", { nullable: true })
    Pagination?: PaginationInputType
  ): Promise<ApiGetPaymentRequestsResponseType> {
    const transactionRequests = await this.transactionRequestRepository.find({
      relations: ["transaction"]
    });

    return {
      success: true,
      data: transactionRequests.slice(
        Pagination?.skip,
        Pagination?.limit === 0 ? transactionRequests.length : Pagination?.limit
      )
    };
  }
}

export default GetPaymentRequestsResolver;
