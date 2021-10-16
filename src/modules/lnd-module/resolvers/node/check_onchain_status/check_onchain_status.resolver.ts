import { Resolver, Arg, Query } from "type-graphql";
import { ApiResponse } from "neutronpay-wallet-common/dist/shared";
import { Service } from "typedi";
import { config } from "../../../config";
import { GetTransactions } from "../../../node";
import { CheckOnChainStatusDto } from "./check_onchain_status.dto";
import { TransactionStatus } from "../../../constants/TransactionStatus.enum";
import { OnChainStatusResponse } from "../onchain_status";
import { ChainInvoiceRepository } from "../../../repository";
import { InjectRepository } from "typeorm-typedi-extensions";

export const ApiCheckOnChainStatusResponse = ApiResponse<OnChainStatusResponse>(
  "CheckOnChainStatus",
  OnChainStatusResponse
);
export type ApiCheckOnChainStatusResponseType = InstanceType<
  typeof ApiCheckOnChainStatusResponse
>;

@Service()
@Resolver(() => OnChainStatusResponse)
class CheckOnChainStatusResolver {
  @InjectRepository(ChainInvoiceRepository)
  private readonly chainInvoiceRepository: ChainInvoiceRepository;

  @Query(() => ApiCheckOnChainStatusResponse, { nullable: true })
  async checkOnChainStatus(
    @Arg("data") { userId, amount, txFee, createdAt }: CheckOnChainStatusDto
  ): Promise<ApiCheckOnChainStatusResponseType> {
    const chainInvoice = await this.chainInvoiceRepository.findOne({
      where: {
        userId,
      },
      order: {
        createdAt: "DESC",
      },
    });

    if (!chainInvoice) {
      return {
        success: false,
        errors: [
          {
            path: "userId",
            message: "Cannot find user chain invoice",
          },
        ],
      };
    }

    let data: OnChainStatusResponse;
    const nodeTransactions = await GetTransactions();
    if (!nodeTransactions) {
      throw new Error("No node transactions found");
    }
    const matchedTransactions = nodeTransactions.transactions.filter(
      (transaction) => transaction.destAddresses.includes(chainInvoice.address)
    );
    console.log(
      "matchedTransactions length",
      chainInvoice.address,
      matchedTransactions.length
    );
    if (matchedTransactions.length === 0)
      return {
        errors: [
          {
            path: "address",
            message: "No node transaction found",
          },
        ],
        success: false,
      };
    const totalAddressDeposits =
      matchedTransactions.reduce(
        (accumulator, currentValue) =>
          accumulator + Number(currentValue.amount),
        0
      ) || 0;
    console.log(
      "matchedTransactions",
      totalAddressDeposits,
      chainInvoice.address,
      Number(amount) + Number(txFee),
      matchedTransactions
    );
    if (totalAddressDeposits >= Number(amount) + Number(txFee)) {
      const transaction = matchedTransactions[0];
      console.log("onChainStatus paid", chainInvoice.address, transaction);
      data = {
        timeStamp: Number(transaction.timeStamp),
        amount: totalAddressDeposits,
        status:
          Number(transaction.timeStamp) < createdAt + config.invoiceExpiry
            ? TransactionStatus.PAID
            : TransactionStatus.EXPIRED,
        txHash: transaction.txHash,
      };
    } else {
      const transaction = matchedTransactions[0];
      console.log(
        "onChainStatus partially-paid",
        chainInvoice.address,
        transaction
      );
      data = {
        timeStamp: Number(transaction.timeStamp),
        amount: totalAddressDeposits,
        status: TransactionStatus.PARTIALLY_PAID,
        txHash: transaction.txHash,
      };
    }
    console.log("onChainStatus data", chainInvoice.address, data);
    return {
      success: true,
      data,
    };
  }
}

export default CheckOnChainStatusResolver;
