import { Resolver, Query, Arg } from "type-graphql";
import { InjectRepository } from "typeorm-typedi-extensions";
import {
  ApiResponse,
  CustomMessage
} from "neutronpay-wallet-common/dist/shared";
import { TransactionRepository } from "../../../repository";
import { Transaction } from "../../../entity/Transaction";
import { GetTransactionDto } from "./get_transaction.dto";
import { Service } from "typedi";

export const ApiGetTransactionResponse = ApiResponse<Transaction>(
  "GetTransaction",
  Transaction
);
export type ApiGetTransactionResponseType = InstanceType<
  typeof ApiGetTransactionResponse
>;

@Service()
@Resolver(() => Transaction)
class GetTransactionResolver {
  @InjectRepository(TransactionRepository)
  private readonly transactionRepository: TransactionRepository;

  @Query(() => ApiGetTransactionResponse!, {
    nullable: true
  })
  async getTransaction(
    @Arg("data") { transactionId }: GetTransactionDto
  ): Promise<ApiGetTransactionResponseType> {
    const transaction = await this.transactionRepository.findOne({
      where: {
        id: transactionId
      }
    });

    if (!transaction) {
      return {
        success: false,
        errors: [
          {
            path: "userId",
            message: CustomMessage.transactionNotFound
          }
        ]
      };
    }
    return {
      success: true,
      data: transaction
    };
  }
}

export default GetTransactionResolver;
