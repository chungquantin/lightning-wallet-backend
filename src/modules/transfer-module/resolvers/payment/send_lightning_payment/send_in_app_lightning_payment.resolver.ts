import { Resolver, UseMiddleware, Mutation, Arg, Ctx } from "type-graphql";
import {
  ApiResponse,
  CustomMessage,
} from "neutronpay-wallet-common/dist/shared";
import { WalletGQLContext } from "../../../server";
import { SendInAppLightningPaymentDto } from "./send_in_app_lightning_payment.dto";
import { isAuth } from "neutronpay-wallet-common/dist/middleware";
import { decode as lightningDecode } from "bolt11";
import { InjectRepository } from "typeorm-typedi-extensions";
import { TransactionStatus } from "../../../constants";
import { Transaction } from "../../../entity/Transaction";
import { WalletRepository, TransactionRepository } from "../../../repository";
import { Service } from "typedi";

export const ApiSendInAppLightningPayment = ApiResponse<Transaction>(
  "SendInAppLightningPayment",
  Transaction
);
export type ApiSendInAppLightningPaymentType = InstanceType<
  typeof ApiSendInAppLightningPayment
>;

@Service()
@Resolver(() => String)
class SendInAppLightningPaymentResolver {
  @InjectRepository(WalletRepository)
  private readonly walletRepository: WalletRepository;
  @InjectRepository(TransactionRepository)
  private readonly transactionRepository: TransactionRepository;

  @UseMiddleware(isAuth)
  @Mutation(() => ApiSendInAppLightningPayment, { nullable: true })
  async sendInAppLightningPayment(
    @Arg("data")
    { paymentRequest, description, walletId }: SendInAppLightningPaymentDto,
    @Ctx()
    { dataSources, currentUser }: WalletGQLContext
  ): Promise<ApiSendInAppLightningPaymentType> {
    const decodedPayReq = lightningDecode(paymentRequest);
    const amountSatoshi = decodedPayReq.satoshis;
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

      const { userWallet, transaction, toWallet } =
        await this.transactionRepository.createTransaction(
          {
            amount: balanceConvertedBtc,
            currency: walletCurrency,
            currentUser,
            walletId,
            method: "LIGHTNING",
            description: description,
          },
          dataSources,
          this.walletRepository
        );

      if (!userWallet || !transaction || !toWallet) {
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
        toWallet.balance += balanceConvertedBtc;
        userWallet.save();
      })();

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

export default SendInAppLightningPaymentResolver;
