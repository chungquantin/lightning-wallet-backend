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
import {
	TransactionRepository,
	WalletRepository,
} from '../../../repository';
import { SendRequestPaymentDto } from './send_payment_request.dto';
import { WalletGQLContext } from '../../../server';
import { mqProduce } from '../../../queue';
import { Queue } from 'neutronpay-wallet-common/dist/constants/queue';
import { TransactionRequest } from '../../../entity/TransactionRequest';
import { TransactionRequestRepository } from '../../../repository/TransactionRequestRepository';
import { TransactionRequestStatus } from '../../../constants/TransactionRequestStatus.enum';
import { REDIS_PAYMENT_SENT_PREFIX } from '../../../constants/globalConstants';
import { CustomMessage } from '../../../constants';

export const ApiSendRequestPaymentResponse =
	ApiResponse<TransactionRequest>(
		'SendPaymentRequest',
		TransactionRequest,
	);
export type ApiSendRequestPaymentResponseType = InstanceType<
	typeof ApiSendRequestPaymentResponse
>;

@Resolver((of) => TransactionRequest)
class SendPaymentRequestResolver {
	@InjectRepository(WalletRepository)
	private readonly walletRepository: WalletRepository;
	@InjectRepository(TransactionRequestRepository)
	private readonly transactionRequestRepository: TransactionRequestRepository;
	@InjectRepository(WalletRepository)
	private readonly transactionRepository: TransactionRepository;

	@UseMiddleware(isAuth)
	@Mutation(() => ApiSendRequestPaymentResponse, { nullable: true })
	async sendPaymentRequest(
		@Arg('data')
		{
			amount,
			currency,
			walletId,
			method,
			description,
		}: SendRequestPaymentDto,
		@Ctx()
		{ currentUser, dataSources, channel, redis }: WalletGQLContext,
	): Promise<ApiSendRequestPaymentResponseType> {
		if (
			(await redis.get(
				`${REDIS_PAYMENT_SENT_PREFIX}${currentUser?.userId}${walletId}`,
			)) === 'TRUE'
		) {
			return {
				success: false,
				errors: [
					{
						path: 'sendPaymentRequest',
						message: CustomMessage.transactionRequestIsSent,
					},
				],
			};
		}
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
				this.walletRepository,
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

		if (userWallet.id === toWallet.id) {
			return {
				success: false,
				errors: [
					{
						message: CustomMessage.stopBeingNaughty,
					},
				],
			};
		}

		const transactionRequest = await this.transactionRequestRepository
			.create({
				requestFrom: userWallet?.id,
				requestTo: toWallet?.id,
				transaction,
				status: TransactionRequestStatus.PENDING,
			})
			.save();

		await redis.set(
			`${REDIS_PAYMENT_SENT_PREFIX}${currentUser?.userId}${walletId}`,
			'TRUE',
			'ex',
			60 * 60 * 24 * 7,
		);

		await mqProduce<'transaction_requested'>(
			channel,
			Queue.NOTIFICATION_QUEUE,
			{
				data: {
					transactionRequest,
				},
				operation: 'transaction_requested',
			},
		);

		return {
			success: true,
			data: transactionRequest,
		};
	}
}

export default SendPaymentRequestResolver;
