import { Arg, Resolver, Mutation, Ctx, UseMiddleware } from "type-graphql";
import { InjectRepository } from "typeorm-typedi-extensions";
import {
  ApiResponse,
  TransactionStatus
} from "neutronpay-wallet-common/dist/shared";
import { isAuth } from "neutronpay-wallet-common/dist/middleware";
import { WalletRepository } from "../../../repository";
import { WalletGQLContext } from "../../../server";
import { mqProduce } from "../../../queue";
import { Queue } from "neutronpay-wallet-common/dist/constants/queue";
import { TransactionRequest } from "../../../entity/TransactionRequest";
import { TransactionRequestRepository } from "../../../repository/TransactionRequestRepository";
import { TransactionRequestStatus } from "../../../constants/TransactionRequestStatus.enum";
import { REDIS_PAYMENT_SENT_PREFIX } from "../../../constants/globalConstants";
import { CustomMessage } from "../../../constants";
import { CancelPaymentRequestDto } from "./cancel_payment_request.dto";
import * as moment from "moment";
import { Service } from "typedi";

export const ApiCancelPaymentRequestResponse = ApiResponse<String>(
  "CancelPaymentRequest",
  String
);
export type ApiCancelPaymentRequestResponseType = InstanceType<
  typeof ApiCancelPaymentRequestResponse
  >;

@Service()
@Resolver(() => TransactionRequest)
class CancelPaymentRequestResolver {
  @InjectRepository(WalletRepository)
  private readonly walletRepository: WalletRepository;
  @InjectRepository(TransactionRequestRepository)
  private readonly transactionRequestRepository: TransactionRequestRepository;

  @UseMiddleware(isAuth)
  @Mutation(() => ApiCancelPaymentRequestResponse, { nullable: true })
  async cancelPaymentRequest(
    @Arg("data")
    { paymentRequestId }: CancelPaymentRequestDto,
    @Ctx()
    { currentUser, channel, redis }: WalletGQLContext
  ): Promise<ApiCancelPaymentRequestResponseType> {
    const userWallet = await this.walletRepository.findOne({
      where: {
        userId: currentUser ?.userId
      }
    });
    if (!userWallet) {
      return {
        success: false,
        errors: [
          {
            message: CustomMessage.walletIsNotFound,
            path: "currentUser"
          }
        ]
      };
    }
    const paymentRequest = await this.transactionRequestRepository.findOne({
      where: {
        id: paymentRequestId,
        requestFrom: userWallet.id
      },
      relations: ["transaction"]
    });
    if (!paymentRequest) {
      return {
        success: false,
        errors: [
          {
            path: "paymentRequest",
            message: CustomMessage.transactionRequestNotFound
          }
        ]
      };
    }

    if (
      paymentRequest.status === TransactionRequestStatus.CANCELED ||
      parseInt(paymentRequest.expiredAt) < moment().unix()
    ) {
      return {
        success: false,
        errors: [
          {
            path: "paymentRequest",
            message: CustomMessage.transactionRequestIsCanceled
          }
        ]
      };
    }

    paymentRequest.status = TransactionRequestStatus.CANCELED;
    paymentRequest.transaction.status = TransactionStatus.DONE;
    paymentRequest.save();

    await redis.set(
      `${REDIS_PAYMENT_SENT_PREFIX}${currentUser ?.userId}${paymentRequest.requestTo}`,
      "FALSE",
      "ex",
      60 * 60 * 24 * 7
    );

    await mqProduce<"transaction_request_canceled">(
      channel,
      Queue.NOTIFICATION_QUEUE,
      {
        data: {
          transactionRequest: paymentRequest
        },
        operation: "transaction_request_canceled"
      }
    );

    return {
      success: true,
      data: `Payment request ${paymentRequestId} is canceled successfully`
    };
  }
}

export default CancelPaymentRequestResolver;
