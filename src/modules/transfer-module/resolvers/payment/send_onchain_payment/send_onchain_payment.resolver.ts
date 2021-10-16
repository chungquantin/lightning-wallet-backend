import { Resolver, UseMiddleware, Mutation, Arg, Ctx } from "type-graphql";
import { Queue } from "neutronpay-wallet-common/dist/constants/queue";
import {
  ApiResponse,
  CustomMessage,
} from "neutronpay-wallet-common/dist/shared";
import { mqProduce } from "../../../queue";
import { WalletGQLContext } from "../../../server";
import { SendOnchainPaymentDto } from "./send_onchain_payment.dto";
import { isAuth } from "neutronpay-wallet-common/dist/middleware";
import { InjectRepository } from "typeorm-typedi-extensions";
import { TransactionStatus } from "../../../constants";
import { Transaction } from "../../../entity/Transaction";
import { WalletRepository, TransactionRepository } from "../../../repository";
import { Service } from "typedi";
import {
  GetChainInvoice,
  GetChainInvoiceDto,
} from "../../../generated/graphql";

export const ApiSendOnchainPayment = ApiResponse<Transaction>(
  "SendOnchainPayment",
  Transaction
);
export type ApiSendOnchainPaymentType = InstanceType<
  typeof ApiSendOnchainPayment
>;

@Service()
@Resolver(() => Transaction)
class SendOnchainPaymentResolver {
  @InjectRepository(WalletRepository)
  private readonly walletRepository: WalletRepository;
  @InjectRepository(TransactionRepository)
  private readonly transactionRepository: TransactionRepository;

  @UseMiddleware(isAuth)
  @Mutation(() => ApiSendOnchainPayment, { nullable: true })
  async sendOnchainPayment(
    @Arg("data")
    { address, amount, description }: SendOnchainPaymentDto,
    @Ctx()
    { channel, dataSources, currentUser }: WalletGQLContext
  ): Promise<ApiSendOnchainPaymentType> {
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
    let balanceConvertedBtc = amount * btcRate;
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
    const chainInvoice = await dataSources.lndService.query<
      GetChainInvoice,
      GetChainInvoiceDto
    >("getChainInvoice", {
      data: {
        address,
      },
    });

    const chainInvoiceResponse = chainInvoice.getChainInvoice;

    if (!chainInvoiceResponse.success && chainInvoiceResponse.errors) {
      return {
        success: false,
        errors: chainInvoiceResponse.errors,
      };
    }

    if (chainInvoiceResponse.data?.userId === currentUser?.userId) {
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
        userId: chainInvoiceResponse.data?.userId,
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
      mqProduce<"onchain_payment_sended">(channel, Queue.LND_QUEUE, {
        data: {
          address,
          amount,
        },
        operation: "onchain_payment_sended",
      });
    }

    // Update transaction status
    transaction.paidAmount = balanceConvertedBtc;
    transaction.save();

    return {
      success: true,
      data: transaction,
    };
  }
}

export default SendOnchainPaymentResolver;
