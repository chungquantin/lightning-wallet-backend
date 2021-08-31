import {
	Arg,
	Resolver,
	Mutation,
	Ctx,
	UseMiddleware,
} from 'type-graphql';
import { InjectRepository } from 'typeorm-typedi-extensions';
import {
	ApiResponse,
	CustomMessage,
} from 'neutronpay-wallet-common/dist/shared';
import { isAuth } from 'neutronpay-wallet-common/dist/middleware';
import {
	TransactionRepository,
	WalletRepository,
} from '../../../repository';
import { Wallet } from '../../../entity';
import { SendRequestPaymentDto } from './send_payment_request.dto';
import { WalletGQLContext } from '../../../server';
import { mqProduce } from '../../../queue';
import { Queue } from 'neutronpay-wallet-common/dist/constants/queue';
import { TransactionRequest } from '../../../entity/TransactionRequest';
import { TransactionRequestRepository } from '../../../repository/TransactionRequestRepository';
import { TransactionRequestStatus } from '../../../constants/TransactionRequestStatus.enum';

export const ApiSendRequestPaymentResponse =
	ApiResponse<TransactionRequest>(
		'SendPaymentRequest',
		TransactionRequest,
	);
export type ApiSendRequestPaymentResponseType = InstanceType<
	typeof ApiSendRequestPaymentResponse
>;

@Resolver((of) => Wallet)
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
		@Ctx() { currentUser, dataSources, channel }: WalletGQLContext,
	): Promise<ApiSendRequestPaymentResponseType> {
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
