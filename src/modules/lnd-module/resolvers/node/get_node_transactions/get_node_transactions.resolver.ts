import {
  Resolver,
  UseMiddleware,
  ObjectType,
  Field,
  Query,
  Arg,
} from "type-graphql";
import { ApiArrayResponse } from "neutronpay-wallet-common/dist/shared";
import { PaginationInputType } from "neutronpay-wallet-common/dist/shared/Pagination";
import { GetTransactions } from "../../../node";
import { Service } from "typedi";

@ObjectType()
class LightningTransaction {
  @Field()
  amount: number;

  @Field()
  hash: string;

  @Field()
  fees: number;

  @Field()
  blockHash: string;

  @Field()
  timeStamp: number;
}

export const ApiGetNodeTransactions = ApiArrayResponse<LightningTransaction>(
  "GetNodeTransactions",
  LightningTransaction
);
export type ApiGetNodeTransactionsType = InstanceType<
  typeof ApiGetNodeTransactions
>;

@Service()
@Resolver(() => String)
class GetNodeTransactions {
  @UseMiddleware()
  @Query(() => ApiGetNodeTransactions, { nullable: true })
  async getNodeTransactions(
    @Arg("Pagination", { nullable: true })
    Pagination?: PaginationInputType
  ): Promise<ApiGetNodeTransactionsType> {
    try {
      const response = await GetTransactions();
      console.log(response);
      return {
        success: true,
        data:
          response?.transactions
            .slice(
              Pagination?.skip,
              Pagination?.limit === 0
                ? response.transactions.length
                : Pagination?.limit
            )
            .map((transaction) => ({
              amount: transaction.amount,
              hash: transaction.txHash,
              fees: transaction.totalFees,
              blockHash: transaction.blockHash,
              timeStamp: transaction.timeStamp,
            })) || [],
      };
    } catch (err) {
      return {
        success: false,
        data: [],
        errors: [
          {
            message: err.message,
            path: "lightningSendPayment",
          },
        ],
      };
    }
  }
}

export default GetNodeTransactions;
