import { Resolver, UseMiddleware, Mutation, Arg, Ctx } from "type-graphql";
import { Queue } from "neutronpay-wallet-common/dist/constants/queue";
import {
  ApiResponse,
  CustomMessage,
} from "neutronpay-wallet-common/dist/shared";
import { mqProduce } from "../../../queue";
import { WalletGQLContext } from "../../../server";
import { SendLightningPaymentDto } from "./send_lightning_payment.dto";
import { isAuth } from "neutronpay-wallet-common/dist/middleware";
import { decode as lightningDecode } from "bolt11";
import { InjectRepository } from "typeorm-typedi-extensions";
import { TransactionStatus } from "../../../constants";
import { Transaction } from "../../../entity/Transaction";
import { WalletRepository, TransactionRepository } from "../../../repository";
import { Service } from "typedi";
import { lightningUtil } from "../../../utils";

export const ApiSendLightningPayment = ApiResponse<Transaction>(
  "SendLightningPayment",
  Transaction
);
export type ApiSendLightningPaymentType = InstanceType<
  typeof ApiSendLightningPayment
>;

@Service()
@Resolver(() => String)
class SendLightningPaymentResolver {
  @InjectRepository(WalletRepository)
  private readonly walletRepository: WalletRepository;
  @InjectRepository(TransactionRepository)
  private readonly transactionRepository: TransactionRepository;

  @UseMiddleware(isAuth)
  @Mutation(() => ApiSendLightningPayment, { nullable: true })
  async sendLightningPayment(
    @Arg("data")
    { paymentRequest }: SendLightningPaymentDto,
    @Ctx()
    { channel, dataSources, currentUser }: WalletGQLContext
  ): Promise<ApiSendLightningPaymentType> {
    const decodedPayReq = lightningDecode(paymentRequest);
    const amountSatoshi = Number(decodedPayReq.satoshis);
    if (amountSatoshi) {
      // Get the current user wallet
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
      let walletBalance = wallet.balance;
      let walletCurrency = wallet.defaultCurrency;
      const btcRate = await dataSources.exchangeRateApi.exchangeRate[
        `btc${walletCurrency}`
      ]();
      let balanceConvertedBtc = (amountSatoshi / 100000000) * btcRate;
      if (balanceConvertedBtc < walletBalance) {
        return {
          success: false,
          errors: [
            {
              message: "amountSatoshi",
              path: `Insufficient funds. Available balance ${balanceConvertedBtc} ${walletCurrency}. Please check already requested withdrawals.`,
            },
          ],
        };
      }

      const { userWallet, transaction } =
        await this.transactionRepository.createTransaction(
          {
            amount: balanceConvertedBtc,
            currency: walletCurrency,
            currentUser,
            walletId: null,
            method: "LIGHTNING",
            description: decodedPayReq.tags.filter(
              (tag) => tag.tagName === "description"
            )[0].data,
          },
          dataSources,
          this.walletRepository
        );

      if (!userWallet || !transaction) {
        return {
          success: false,
          errors: [
            {
              message: CustomMessage.cannotCreateTransaction,
            },
          ],
        };
      }

      (async () => {
        // Adding and subtracting money from user balance
        this.walletRepository.addPayment(userWallet, transaction);
        userWallet.balance -= balanceConvertedBtc;

        userWallet.save();
      })();

      // Lightning Module handler
      mqProduce<"lightning_payment_sended">(channel, Queue.LND_QUEUE, {
        data: paymentRequest as any,
        operation: "lightning_payment_sended",
      });

      // Update transaction status
      transaction.status = TransactionStatus.PAID;
      transaction.paidAmount = balanceConvertedBtc;
      transaction.save();

      return {
        success: true,
        data: transaction,
      };
    } else {
      return {
        success: false,
        errors: [
          {
            message: "Invalid payment request",
            path: "amountSatoshi",
          },
        ],
      };
    }
  }
}

export default SendLightningPaymentResolver;
