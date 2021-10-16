import { Arg, Query, Resolver } from "type-graphql";
import { LightningInvoice } from "../../../entity";
import { LookupOnChainTransactionDto } from "./lookup_onchain_transactions.dto";
import { Service } from "typedi";
import { OnChainStatusResponse } from "../onchain_status";
import { GetTransactions } from "../../../node";
import { OnchainTransaction } from "../onchain_transaction";
import { ApiArrayResponse } from "neutronpay-wallet-common";

export const ApiLookupOnchainTransactionResponse =
  ApiArrayResponse<OnchainTransaction>(
    "LookupOnchainTransaction",
    OnchainTransaction
  );
export type ApiLookupOnchainTransactionResponseType = InstanceType<
  typeof ApiLookupOnchainTransactionResponse
>;

@Service()
@Resolver(() => LightningInvoice)
class LookupOnchainTransactionResolver {
  @Query(() => ApiLookupOnchainTransactionResponse, {
    nullable: true,
  })
  async lookupOnchainTransaction(
    @Arg("data")
    { address }: LookupOnChainTransactionDto
  ): Promise<ApiLookupOnchainTransactionResponseType> {
    let data: OnChainStatusResponse;
    const nodeTransactions = await GetTransactions();
    if (!nodeTransactions) {
      throw new Error("No node transactions found");
    }
    const matchedTransactions = nodeTransactions.transactions.filter(
      (transaction) => transaction.destAddresses.includes(address)
    );
    console.log(
      "matchedTransactions length",
      address,
      matchedTransactions.length
    );
    if (matchedTransactions.length === 0)
      return {
        data: [],
        errors: [
          {
            path: "address",
            message: "No node transaction found",
          },
        ],
        success: false,
      };
    return {
      success: true,
      data: matchedTransactions,
    };
  }
}

export default LookupOnchainTransactionResolver;
