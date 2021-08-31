import {
	Arg,
	Resolver,
	Mutation,
	Ctx,
	UseMiddleware,
} from 'type-graphql';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { ApiResponse } from 'neutronpay-wallet-common/dist/shared';
import { isAuth } from 'neutronpay-wallet-common/dist/middleware';
import { WalletRepository } from '../../../repository';
import { Wallet } from '../../../entity';
import { WalletGQLContext } from '../../../server';
import { mqProduce } from '../../../queue';
import { CustomMessage, TransactionStatus } from '../../../constants';
import { Queue } from 'neutronpay-wallet-common/dist/constants/queue';
import { RespondPaymentRequestDto } from './respond_payment_request.dto';
import { TransactionRequestRepository } from '../../../repository/TransactionRequestRepository';
import * as moment from 'moment';
import { TransactionRequestStatus } from '../../../constants/TransactionRequestStatus.enum';
import { REDIS_PAYMENT_SENT_PREFIX } from '../../../constants/globalConstants';

export const ApiRespondPaymentRequest = ApiResponse<Boolean>(
	'RespondPaymentRequest',
	Boolean,
);
export type ApiRespondPaymentRequestType = InstanceType<
	typeof ApiRespondPaymentRequest
>;

@Resolver((of) => Wallet)
class RespondPaymentRequestResolver {
	@InjectRepository(WalletRepository)
	private readonly walletRepository: WalletRepository;

	@InjectRepository(TransactionRequestRepository)
	private readonly transactionRequestRepository: TransactionRequestRepository;

	@UseMiddleware(isAuth)
	@Mutation(() => ApiRespondPaymentRequest, { nullable: true })
	async respondPaymentRequest(
		@Arg('data')
		{ confirmed, paymentRequestId }: RespondPaymentRequestDto,
		@Ctx()
		{ currentUser, dataSources, channel, redis }: WalletGQLContext,
	): Promise<ApiRespondPaymentRequestType> {
		try {
			const userWallet = await this.walletRepository.findOne({
				where: {
					userId: currentUser?.userId,
				},
			});

			if (!userWallet) {
				return {
					success: false,
					errors: [
						{
							path: 'paymentRequestId',
							message: CustomMessage.walletIsNotFound,
						},
					],
				};
			}

			const transactionRequest =
				await this.transactionRequestRepository.findOne({
					where: {
						id: paymentRequestId,
					},
					relations: ['transaction'],
				});

			if (!transactionRequest) {
				return {
					success: false,
					errors: [
						{
							path: 'paymentRequestId',
							message: CustomMessage.transactionRequestNotFound,
						},
					],
				};
			}

			if (
				transactionRequest.status ===
					TransactionRequestStatus.CONFIRMED ||
				transactionRequest.status ===
					TransactionRequestStatus.REJECTED
			) {
				return {
					success: false,
					errors: [
						{
							path: 'transactionRequestStatus',
							message:
								CustomMessage.transactionRequestIsConfirmedOrRejected,
						},
					],
				};
			}
			if (moment().unix() > parseInt(transactionRequest.expiredAt)) {
				return {
					success: false,
					errors: [
						{
							path: 'expiredAt',
							message: CustomMessage.transactionIsExpired,
						},
					],
				};
			}

			if (transactionRequest.requestTo !== userWallet.id) {
				return {
					success: false,
					errors: [
						{
							path: 'requestTo',
							message: CustomMessage.thisRequestIsNotForYou,
						},
					],
				};
			}

			const fromWallet = await this.walletRepository.findOne({
				where: {
					id: transactionRequest.requestFrom,
				},
			});

			if (!fromWallet) {
				return {
					success: false,
					errors: [
						{
							path: 'fromWallet',
							message: CustomMessage.walletIsNotFound,
						},
					],
				};
			}

			if (confirmed) {
				transactionRequest.status =
					TransactionRequestStatus.CONFIRMED;
				transactionRequest.transaction.status =
					TransactionStatus.DONE;

				const { currency, transaction, amount } = {
					currency: transactionRequest.transaction.currency,
					transaction: transactionRequest.transaction,
					amount: transactionRequest.transaction.amount,
				};

				// Handle balance wallet
				(async () => {
					// Adding and subtracting money from user balance
					this.walletRepository.addPayment(userWallet, transaction);
					if (currency !== userWallet?.defaultCurrency) {
						const exchangeRate =
							await dataSources.exchangeRateApi.exchangeRate[
								`${userWallet.defaultCurrency.toLowerCase()}${currency}`
							]();
						userWallet.balance -= exchangeRate * amount;
					} else {
						userWallet.balance -= amount;
					}
					userWallet.save();
					// Adding and subtracting money from destination balance
					this.walletRepository.addPayment(fromWallet, transaction);
					if (currency !== fromWallet.defaultCurrency) {
						const exchangeRate =
							await dataSources.exchangeRateApi.exchangeRate[
								`${fromWallet.defaultCurrency.toLowerCase()}${currency}`
							]();
						fromWallet.balance += exchangeRate * amount;
					} else {
						fromWallet.balance += amount;
					}
					fromWallet.save();
				})();
				transactionRequest.save();

				mqProduce<'transaction_request_confirmed'>(
					channel,
					Queue.NOTIFICATION_QUEUE,
					{
						data: { transactionRequest },
						operation: 'transaction_request_confirmed',
					},
				);

				return {
					success: true,
					data: true,
				};
			} else {
				transactionRequest.status = TransactionRequestStatus.REJECTED;
				transactionRequest.transaction.status =
					TransactionStatus.DONE;
				transactionRequest.save();

				mqProduce<'transaction_request_rejected'>(
					channel,
					Queue.NOTIFICATION_QUEUE,
					{
						data: { transactionRequest },
						operation: 'transaction_request_rejected',
					},
				);

				await redis.set(
					`${REDIS_PAYMENT_SENT_PREFIX}${currentUser?.userId}${fromWallet.id}`,
					'FALSE',
					'ex',
					60 * 60 * 24 * 7,
				);

				return {
					success: true,
					data: false,
				};
			}
		} catch (err) {
			return {
				success: false,
				errors: [
					{
						path: 'respondPaymentRequest',
						message: err.message,
					},
				],
			};
		}
	}
}

export default RespondPaymentRequestResolver;
