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
import {
  GetLightningInvoice,
  GetLightningInvoiceDto,
} from "../../../generated/graphql";

export const ApiSendLightningPayment = ApiResponse<Transaction>(
  "SendLightningPayment",
  Transaction
);
export type ApiSendLightningPaymentType = InstanceType<
  typeof ApiSendLightningPayment
>;

@Service()
@Resolver(() => Transaction)
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
      if (balanceConvertedBtc <= 0) {
        return {
          success: false,
          errors: [
            {
              message: "amount",
              path: `Invalid bitcoin amount`,
            },
          ],
        };
      }
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

      // Find destination userId on app
      const lightningInvoice = await dataSources.lndService.query<
        GetLightningInvoice,
        GetLightningInvoiceDto
      >("getLightningInvoice", {
        data: {
          paymentRequest,
        },
      });

      const lightningInvoiceResponse = lightningInvoice.getLightningInvoice;

      if (
        !lightningInvoiceResponse.success &&
        lightningInvoiceResponse.errors
      ) {
        return {
          success: false,
          errors: lightningInvoiceResponse.errors,
        };
      }

      if (lightningInvoiceResponse.data?.userId === currentUser?.userId) {
        return {
          success: false,
          errors: [
            {
              message: CustomMessage.stopBeingNaughty,
              path: "userId",
            },
          ],
        };
      }

      const destinationWallet = await this.walletRepository.findOne({
        where: {
          userId: lightningInvoiceResponse.data?.userId,
        },
      });

      const { userWallet, transaction, toWallet } =
        await this.transactionRepository.createTransaction(
          {
            amount: balanceConvertedBtc,
            currency: walletCurrency,
            currentUser,
            walletId: destinationWallet?.id,
            method: "LIGHTNING",
            description: decodedPayReq.tags.filter(
              (tag) => tag.tagName === "description"
            )[0].data,
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

      if (toWallet) {
        // Destination is inside app
        // Adding and subtracting money from user balance
        this.walletRepository.addPayment(userWallet, transaction);
        userWallet.balance -= balanceConvertedBtc;
        userWallet.save();
        // Adding and subtracting money from destination balance
        this.walletRepository.addPayment(toWallet, transaction);
        if (userWallet.defaultCurrency !== toWallet.defaultCurrency) {
          const exchangeRate = await dataSources.exchangeRateApi.exchangeRate[
            `${toWallet.defaultCurrency.toLowerCase()}${
              userWallet.defaultCurrency
            }`
          ]();
          toWallet.balance += exchangeRate * balanceConvertedBtc;
        } else {
          toWallet.balance += balanceConvertedBtc;
        }
        toWallet.save();
        transaction.status = TransactionStatus.PAID;
      } else {
        // Destination is outside app
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
        // Adding and subtracting money from user balance
        this.walletRepository.addPayment(userWallet, transaction);
        userWallet.balance -= balanceConvertedBtc;
        userWallet.save();
        // Lightning Module handler
        transaction.status = TransactionStatus.PENDING;
        mqProduce<"lightning_payment_sended">(channel, Queue.LND_QUEUE, {
          data: paymentRequest as any,
          operation: "lightning_payment_sended",
        });
      }

      // Update transaction status
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
