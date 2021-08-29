import { EntityRepository, Repository } from 'typeorm';
import { CustomMessage, FiatCurrency } from '../../../common/shared';
import { TransactionStatus } from '../../../common/shared/TransactionStatus.enum';
import { Wallet } from '../entity';
import { Transaction } from '../entity/Transaction';
import { bitcoinUtil } from '../utils';

@EntityRepository(Transaction)
export class TransactionRepository extends Repository<Transaction> {
	async createTransaction(
		{ currency, amount, currentUser, walletId, description, method },
		dataSources,
		walletRepository,
	) {
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
		const userWallet: Wallet = await walletRepository.findOne({
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
		const toWallet: Wallet = await walletRepository.findOne({
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

		const transaction = await this.create({
			amount,
			btcAmount,
			btcExchangeRate,
			currency,
			fromWalletId: userWallet.id,
			toWalletId: toWallet.id,
			description,
			networkFee: 0,
			transactionFee: 0,
			status: TransactionStatus.PENDING,
			wallet: [userWallet, toWallet],
			method,
		}).save();

		return { transaction, userWallet, toWallet };
	}
}
