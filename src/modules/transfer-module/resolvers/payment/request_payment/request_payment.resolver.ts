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
} from '../../../../../common/shared';
import { isAuth } from '../../../../../common/middleware';
import {
	TransactionRepository,
	WalletRepository,
} from '../../../repository';
import { Wallet } from '../../../entity';
import { RequestPaymentDto } from './request_payment.dto';
import { WalletGQLContext } from '../../../server';
import { mqProduce } from '../../../queue';
import { Queue } from '../../../../../common/constants/queue';
import { TransactionRequest } from '../../../entity/TransactionRequest';
import { TransactionRequestRepository } from '../../../repository/TransactionRequestRepository';

export const ApiRequestPaymentResponse =
	ApiResponse<TransactionRequest>(
		'RequestTransaction',
		TransactionRequest,
	);
export type ApiRequestPaymentResponseType = InstanceType<
	typeof ApiRequestPaymentResponse
>;

@Resolver((of) => Wallet)
class RequestPaymentResolver {
	@InjectRepository(WalletRepository)
	private readonly walletRepository: WalletRepository;

	@InjectRepository(TransactionRequestRepository)
	private readonly transactionRequestRepository: TransactionRequestRepository;

	@InjectRepository(WalletRepository)
	private readonly transactionRepository: TransactionRepository;

	@UseMiddleware(isAuth)
	@Mutation(() => ApiRequestPaymentResponse, { nullable: true })
	async requestPayment(
		@Arg('data')
		{
			amount,
			currency,
			walletId,
			method,
			description,
		}: RequestPaymentDto,
		@Ctx() { currentUser, dataSources, channel }: WalletGQLContext,
	): Promise<ApiRequestPaymentResponseType> {
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

		const transactionRequest = await this.transactionRequestRepository
			.create({
				requestFrom: userWallet?.id,
				requestTo: toWallet?.id,
				transaction,
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

export default RequestPaymentResolver;
