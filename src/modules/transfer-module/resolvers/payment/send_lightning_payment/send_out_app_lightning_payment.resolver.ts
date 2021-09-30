import {
	Resolver,
	UseMiddleware,
	Mutation,
	Arg,
	Ctx,
} from 'type-graphql';
import { Queue } from 'neutronpay-wallet-common/dist/constants/queue';
import {
	ApiResponse,
	CustomMessage,
} from 'neutronpay-wallet-common/dist/shared';
import { mqProduce } from '../../../queue';
import { WalletGQLContext } from '../../../server';
import { SendOutAppLightningPaymentDto } from './send_out_app_lightning_payment.dto';
import { isAuth } from 'neutronpay-wallet-common/dist/middleware';
import { decode as lightningDecode } from 'bolt11';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { TransactionStatus } from '../../../constants';
import { Transaction } from '../../../entity/Transaction';
import {
	WalletRepository,
	TransactionRepository,
} from '../../../repository';

export const ApiSendOutAppLightningPayment = ApiResponse<Transaction>(
	'SendOutAppLightningPayment',
	Transaction,
);
export type ApiSendOutAppLightningPaymentType = InstanceType<
	typeof ApiSendOutAppLightningPayment
>;

@Resolver((of) => String)
class SendOutAppLightningPaymentResolver {
	@InjectRepository(WalletRepository)
	private readonly walletRepository: WalletRepository;
	@InjectRepository(TransactionRepository)
	private readonly transactionRepository: TransactionRepository;

	@UseMiddleware(isAuth)
	@Mutation(() => ApiSendOutAppLightningPayment, { nullable: true })
	async sendOutAppLightningPayment(
		@Arg('data')
		{ paymentRequest, description }: SendOutAppLightningPaymentDto,
		@Ctx()
		{ channel, dataSources, currentUser }: WalletGQLContext,
	): Promise<ApiSendOutAppLightningPaymentType> {
		const decodedPayReq = lightningDecode(paymentRequest);
		const amountSatoshi = decodedPayReq.satoshis;
		if (amountSatoshi) {
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
							path: 'userId',
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
			let balanceConvertedBtc = (amountSatoshi / 100000000) * btcRate;
			if (balanceConvertedBtc < walletBalance) {
				return {
					success: false,
					errors: [
						{
							message: 'amountSatoshi',
							path: `Insufficient funds. Available balance ${balanceConvertedBtc} ${walletCurrency}. Please check already requested withdrawals.`,
						},
					],
				};
			}

			const { userWallet, transaction } =
				await this.transactionRepository.createTransaction(
					{
						amount: balanceConvertedBtc,
						currency: walletCurrency,
						currentUser,
						walletId: null,
						method: 'LIGHTNING',
						description: description,
					},
					dataSources,
					this.walletRepository,
				);

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

			(async () => {
				// Adding and subtracting money from user balance
				this.walletRepository.addPayment(userWallet, transaction);
				userWallet.balance -= balanceConvertedBtc;

				userWallet.save();
			})();

			// Lightning Module handler
			mqProduce<'lightning_payment_sended'>(
				channel,
				Queue.LND_QUEUE,
				{
					data: paymentRequest as any,
					operation: 'lightning_payment_sended',
				},
			);

			// Update transaction status
			transaction.status = TransactionStatus.DONE;
			transaction.save();

			return {
				success: true,
				data: transaction,
			};
		} else {
			return {
				success: false,
				errors: [
					{
						message: 'Invalid payment request',
						path: 'amountSatoshi',
					},
				],
			};
		}
	}
}

export default SendOutAppLightningPaymentResolver;
