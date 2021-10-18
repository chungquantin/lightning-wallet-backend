import { Arg, Resolver, Mutation, Ctx, UseMiddleware } from "type-graphql";
import { InjectRepository } from "typeorm-typedi-extensions";
import {
  ApiResponse,
  CustomMessage,
} from "neutronpay-wallet-common/dist/shared";
import { isAuth } from "neutronpay-wallet-common/dist/middleware";
import { TransactionRepository, WalletRepository } from "../../../repository";
import { Wallet } from "../../../entity";
import { SendInAppPaymentDto } from "./send_in_app_payment.dto";
import { Transaction } from "../../../entity/Transaction";
import { WalletGQLContext } from "../../../server";
import { mqProduce } from "../../../queue";
import { TransactionStatus } from "../../../constants";
import { Queue } from "neutronpay-wallet-common/dist/constants/queue";
import { Service } from "typedi";
import * as moment from "moment";

export const ApiSendInAppPaymentResponse = ApiResponse<Transaction>(
  "SendInAppPayment",
  Transaction
);
export type ApiSendInAppPaymentResponseType = InstanceType<
  typeof ApiSendInAppPaymentResponse
>;

@Service()
@Resolver(() => Wallet)
class SendInAppPaymentResolver {
  @InjectRepository(WalletRepository)
  private readonly walletRepository: WalletRepository;

  @InjectRepository(WalletRepository)
  private readonly transactionRepository: TransactionRepository;

  @UseMiddleware(isAuth)
  @Mutation(() => ApiSendInAppPaymentResponse, { nullable: true })
  async sendInAppPayment(
    @Arg("data")
    { amount, currency, walletId, method, description }: SendInAppPaymentDto,
    @Ctx()
    { currentUser, dataSources, channel }: WalletGQLContext
  ): Promise<ApiSendInAppPaymentResponseType> {
    const { transaction, userWallet, toWallet } =
      await this.transactionRepository.createTransaction(
        {
          amount,
          currency,
          currentUser,
          walletId,
          method,
          description,
        },
        dataSources,
        this.walletRepository
      );

    if (!transaction || !userWallet || !toWallet) {
      return {
        success: false,
        errors: [
          {
            message: CustomMessage.cannotCreateTransaction,
          },
        ],
      };
    }
    // Handle balance wallet
    (async () => {
      // Adding and subtracting money from user balance
      this.walletRepository.addPayment(userWallet, transaction);
      if (currency !== userWallet?.defaultCurrency) {
        const exchangeRate = await dataSources.exchangeRateApi.exchangeRate[
          `${userWallet.defaultCurrency.toLowerCase()}${currency}`
        ]();
        userWallet.balance -= exchangeRate * amount;
      } else {
        userWallet.balance -= amount;
      }
      userWallet.save();
      // Adding and subtracting money from destination balance
      this.walletRepository.addPayment(toWallet, transaction);
      if (currency !== toWallet.defaultCurrency) {
        const exchangeRate = await dataSources.exchangeRateApi.exchangeRate[
          `${toWallet.defaultCurrency.toLowerCase()}${currency}`
        ]();
        toWallet.balance += exchangeRate * amount;
      } else {
        toWallet.balance += amount;
      }
      toWallet.save();
    })();

    // Update transaction status
    transaction.status = TransactionStatus.PAID;
    transaction.paidAmount = amount;
    transaction.settledAt = moment().unix().toString();
    transaction.save();

    mqProduce<"transaction_sended">(channel, Queue.NOTIFICATION_QUEUE, {
      data: {
        transaction,
      },
      operation: "transaction_sended",
    });

    return {
      success: true,
      data: transaction,
    };
  }
}

export default SendInAppPaymentResolver;
