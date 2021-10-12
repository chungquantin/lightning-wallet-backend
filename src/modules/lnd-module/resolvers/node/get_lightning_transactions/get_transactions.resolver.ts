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

export const ApiGetLightningTransactions =
  ApiArrayResponse<LightningTransaction>(
    "LndGetTransactions",
    LightningTransaction
  );
export type ApiGetLightningTransactionsType = InstanceType<
  typeof ApiGetLightningTransactions
>;

@Service()
@Resolver(() => String)
class LightningGetTransactionsResolver {
  @UseMiddleware()
  @Query(() => ApiGetLightningTransactions, { nullable: true })
  async lightningGetTransactions(
    @Arg("Pagination", { nullable: true })
    Pagination?: PaginationInputType
  ): Promise<ApiGetLightningTransactionsType> {
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

export default LightningGetTransactionsResolver;
