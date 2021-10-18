import { Resolver, UseMiddleware, Arg, Mutation, Ctx } from "type-graphql";
import { ApiResponse } from "neutronpay-wallet-common/dist/shared";
import { Service } from "typedi";
import { CheckTransactionStatusDto } from "./check_transaction_status.dto";
import { InjectRepository } from "typeorm-typedi-extensions";
import { TransactionRepository } from "../../../repository";
import {
  CustomMessage,
  TransactionMethod,
  TransactionStatus,
} from "../../../constants";
import { WalletGQLContext } from "../../../server";
import {
  CheckLightningStatus,
  CheckLightningStatusDto,
  CheckOnChainStatus,
  CheckOnChainStatusDto,
} from "../../../generated/graphql";
import { isAuth } from "neutronpay-wallet-common/dist/middleware";
import { CheckTransactionStatusResponse } from "./transaction_status";
import { config } from "../../../config";
import { TransactionRequestRepository } from "../../../repository/TransactionRequestRepository";
import * as moment from "moment";

export const ApiCheckTransactionStatus =
  ApiResponse<CheckTransactionStatusResponse>(
    "CheckTransactionStatus",
    CheckTransactionStatusResponse
  );
export type ApiCheckTransactionStatusType = InstanceType<
  typeof ApiCheckTransactionStatus
>;

@Service()
@Resolver(() => String)
class CheckTransactionStatusResolver {
  @InjectRepository(TransactionRepository)
  private readonly transactionRepository: TransactionRepository;
  @InjectRepository(TransactionRequestRepository)
  private readonly transactionRequestRepository: TransactionRequestRepository;

  @UseMiddleware(isAuth)
  @Mutation(() => ApiCheckTransactionStatus, { nullable: true })
  async checkTransactionStatus(
    @Ctx() { currentUser, dataSources }: WalletGQLContext,
    @Arg("data") { transactionId }: CheckTransactionStatusDto
  ): Promise<ApiCheckTransactionStatusType> {
    const transaction = await this.transactionRepository.findOne({
      where: {
        id: transactionId,
      },
    });
    if (!transaction) {
      return {
        success: false,
        errors: [
          {
            path: "transactionId",
            message: CustomMessage.transactionNotFound,
          },
        ],
      };
    }
    console.log("checkTransactionStatus", transactionId, transaction);
    if (
      transaction.status === TransactionStatus.UNPAID ||
      transaction.status === TransactionStatus.PARTIALLY_PAID ||
      transaction.status === TransactionStatus.PENDING
    ) {
      if (transaction.method === TransactionMethod.ON_CHAIN) {
        // Request onchain status on LND service
        const onChainStatus = await dataSources.lndService.mutation<
          CheckOnChainStatus,
          CheckOnChainStatusDto
        >("checkOnChainStatus", {
          data: {
            userId: currentUser?.userId as string,
            txFee: transaction.transactionFee,
            createdAt: Number(transaction.createdAt),
            amount: transaction.btcAmount,
          },
        });
        const response = onChainStatus.checkOnChainStatus;
        console.log("onChainStatus", onChainStatus);
        if (!response.success) {
          return {
            success: false,
            errors: [
              {
                path: response.errors?.[0].path || "",
                message: response.errors?.[0].message || "",
              },
            ],
          };
        }
        if (!response.data) {
          return {
            success: false,
            errors: [
              {
                message: "checking onchain status does not respond data",
                path: "onChainStatus",
              },
            ],
          };
        }
        transaction.status = response.data.status as any;
        transaction.settledAt = response.data.timeStamp.toString();
        transaction.paidAmount = response.data.amount;
        if (
          transaction.settledAt <
          transaction.createdAt + config.invoiceExpiry
        ) {
          console.log("settled at time is pre expiry time");
        } else {
          console.log("settled at time is post expiry time");
          transaction.status = TransactionStatus.EXPIRED;
        }
        transaction.save();
      } else if (transaction.method === TransactionMethod.LIGHTNING) {
        // Request lightning status on LND service
        const lightningStatus = await dataSources.lndService.mutation<
          CheckLightningStatus,
          CheckLightningStatusDto
        >("checkLightningStatus", {
          data: {
            userId: currentUser?.userId as string,
          },
        });
        console.log("lightningStatus", lightningStatus);
        transaction.status = TransactionStatus.PAID;
        transaction.save();
      } else {
        // Request in app
        const transactionRequest =
          await this.transactionRequestRepository.findOne({
            where: {
              transaction: {
                id: transaction.id,
              },
            },
            relations: ["transaction"],
          });
        if (transactionRequest) {
          if (parseInt(transactionRequest.expiredAt) < moment().unix()) {
            transaction.status = TransactionStatus.EXPIRED;
            transaction.save();
          }
        }
      }
      console.log("Done", transactionId, transaction.status);

      return {
        success: false,
        data: {
          transactionId: transaction.id,
          status: transaction.status,
          paidAmount:
            transaction.status === TransactionStatus.PARTIALLY_PAID
              ? transaction.paidAmount
              : 0,
          method: transaction.method,
        },
      };
    } else {
      console.log("Transaction is paid", transaction.status);
      return {
        data: {
          method: transaction.method,
          paidAmount: transaction.btcAmount,
          status: transaction.status,
          transactionId: transaction.id,
        },
        success: true,
      };
    }
  }
}

export default CheckTransactionStatusResolver;
