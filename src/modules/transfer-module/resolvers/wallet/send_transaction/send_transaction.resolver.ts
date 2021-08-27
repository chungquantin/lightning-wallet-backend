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
	FiatCurrency,
} from '../../../../../common/shared';
import { isAuth } from '../../../../../common/middleware';
import {
	TransactionRepository,
	WalletRepository,
} from '../../../repository';
import { Wallet } from '../../../entity';
import { SendTransactionDto } from './send_transaction.dto';
import { Transaction } from '../../../entity/Transaction';
import { WalletGQLContext } from '../../..';
import { bitcoinUtil } from '../../../utils';
import { mqProduce, Queue } from '../../../queue';

@ObjectType()
class TransactionResponse {
	@Field()
	transaction: Transaction;
}

export const ApiSendResponse = ApiResponse<TransactionResponse>(
	'SendTransaction',
	TransactionResponse,
);
export type ApiSendResponseType = InstanceType<
	typeof ApiSendResponse
>;

@Resolver((of) => Wallet)
class SendTransactionResolver {
	@InjectRepository(WalletRepository)
	private readonly walletRepository: WalletRepository;

	@InjectRepository(WalletRepository)
	private readonly transactionRepository: TransactionRepository;

	@UseMiddleware(isAuth)
	@Mutation(() => ApiSendResponse, { nullable: true })
	async sendTransaction(
		@Arg('data')
		{ amount, currency, walletId, method }: SendTransactionDto,
		@Ctx() { currentUser, dataSources, channel }: WalletGQLContext,
	): Promise<ApiSendResponseType> {
		// Validate withdrawable amount
		const MAX_USD_AMOUNT_THRESHOLD = 10000;
		const MIN_USD_AMOUNT_THRESHOLD = 1;
		let scopedAmount = amount;
		if (currency !== FiatCurrency.USD) {
			const exchangeRate =
				await dataSources.exchangeRateApi.exchangeRate[
					`usd${currency}`
				]();
			scopedAmount = exchangeRate * scopedAmount;
		}
		if (
			scopedAmount > MAX_USD_AMOUNT_THRESHOLD ||
			scopedAmount < MIN_USD_AMOUNT_THRESHOLD ||
			scopedAmount < 0
		) {
			return {
				success: false,
				errors: [
					{
						path: 'amount',
						message: CustomMessage.amountIsNotValid,
					},
				],
			};
		}

		// Check if user wallet exists
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
						message: CustomMessage.walletIsNotFound,
						path: 'currentUser',
					},
				],
			};
		}

		// Handle check user balance
		let convertedAmount: number = amount;
		if (currency !== userWallet.defaultCurrency) {
			const exchangeRate =
				await dataSources.exchangeRateApi.exchangeRate[
					`${userWallet.defaultCurrency.toLowerCase()}${currency}`
				]();
			convertedAmount = exchangeRate * amount;
		}
		if (convertedAmount > userWallet.balance) {
			return {
				success: false,
				errors: [
					{
						message: CustomMessage.walletDontHaveEnoughBalance,
						path: 'walletBalance',
					},
				],
			};
		}

		// Check if destination wallet exists
		const toWallet = await this.walletRepository.findOne({
			where: {
				id: walletId,
			},
		});

		if (!toWallet) {
			return {
				success: false,
				errors: [
					{
						message: CustomMessage.walletIsNotFound,
						path: 'walletId',
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
						path: 'walletId',
					},
				],
			};
		}

		// Get btc information
		const btcExchangeRate =
			await dataSources.exchangeRateApi.exchangeRate[
				`btc${currency}`
			]();
		const btcAmount = bitcoinUtil.formatBTC(amount * btcExchangeRate);

		const transaction = await this.transactionRepository
			.create({
				amount,
				btcAmount,
				btcExchangeRate,
				currency,
				fromWalletId: userWallet.id,
				toWalletId: toWallet.id,
				method,
			})
			.save();

		// Adding and subtracting money from user balance
		this.walletRepository.addTransaction(userWallet, transaction);
		if (currency !== userWallet.defaultCurrency) {
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
		this.walletRepository.addTransaction(toWallet, transaction);
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

		mqProduce<'transaction_sended'>(
			channel,
			Queue.ACCOUNT_TRANSFER_QUEUE,
			{
				data: {
					amount: transaction.amount,
					currency: transaction.currency,
					fromWallet: transaction.fromWalletId,
					toWallet: transaction.toWalletId,
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

export default SendTransactionResolver;
