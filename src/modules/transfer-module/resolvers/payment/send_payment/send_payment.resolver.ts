import {
	Arg,
	Resolver,
	Mutation,
	Ctx,
	UseMiddleware,
	ObjectType,
	Field,
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
import { SendPaymentDto } from './send_payment.dto';
import { Transaction } from '../../../entity/Transaction';
import { WalletGQLContext } from '../../../server';
import { mqProduce } from '../../../queue';
import { TransactionStatus } from '../../../constants';
import { Queue } from 'neutronpay-wallet-common/dist/constants/queue';

@ObjectType()
class PaymentResponse {
	@Field()
	transaction: Transaction;
}

export const ApiSendResponse = ApiResponse<PaymentResponse>(
	'SendTransaction',
	PaymentResponse,
);
export type ApiSendResponseType = InstanceType<
	typeof ApiSendResponse
>;

@Resolver((of) => Wallet)
class SendPaymentResolver {
	@InjectRepository(WalletRepository)
	private readonly walletRepository: WalletRepository;

	@InjectRepository(WalletRepository)
	private readonly transactionRepository: TransactionRepository;

	@UseMiddleware(isAuth)
	@Mutation(() => ApiSendResponse, { nullable: true })
	async sendPayment(
		@Arg('data')
		{
			amount,
			currency,
			walletId,
			method,
			description,
		}: SendPaymentDto,
		@Ctx() { currentUser, dataSources, channel }: WalletGQLContext,
	): Promise<ApiSendResponseType> {
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
			this.walletRepository.addPayment(toWallet, transaction);
			if (currency !== toWallet.defaultCurrency) {
				const exchangeRate =
					await dataSources.exchangeRateApi.exchangeRate[
						`${toWallet.defaultCurrency.toLowerCase()}${currency}`
					]();
				toWallet.balance += exchangeRate * amount;
			} else {
				toWallet.balance += amount;
			}
			toWallet.save();
		})();

		// Update transaction status
		transaction.status = TransactionStatus.DONE;
		transaction.save();

		mqProduce<'transaction_sended'>(
			channel,
			Queue.NOTIFICATION_QUEUE,
			{
				data: {
					transaction,
				},
				operation: 'transaction_sended',
			},
		);

		return {
			success: true,
			data: {
				transaction,
			},
		};
	}
}

export default SendPaymentResolver;
