import {
	Resolver,
	Mutation,
	Ctx,
	UseMiddleware,
	Arg,
} from 'type-graphql';
import { ApiResponse } from 'neutronpay-wallet-common/dist/shared';
import { BankAccount } from '../../../entity';
import { BankGQLContext } from '../../../server';
import { isAuth } from 'neutronpay-wallet-common/dist/middleware';
import { WithdrawDto } from './withdraw.dto';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { BankAccountRepository } from '../../../repository';
import { ServiceCustomMessage } from '../../../constants/CustomMessage';
import {
	ACHClass,
	BankTransferNetwork,
	BankTransferType,
} from 'plaid';

export const ApiWithdraw = ApiResponse<String>('Deposit', String);
export type ApiWithdrawType = InstanceType<typeof ApiWithdraw>;

/**
 * Withdraw - Transferring funds out (FBO -> Bank account)
 * @url https://plaid.com/docs/bank-transfers/#transferring-funds-in
 *	@author chungquantin
 */
@Resolver((of) => BankAccount)
class WithdrawResolver {
	@InjectRepository(BankAccountRepository)
	private readonly bankAccountRepository: BankAccountRepository;

	@UseMiddleware(isAuth)
	@Mutation(() => ApiWithdraw, { nullable: true })
	async deposit(
		@Arg('data')
		{
			accountName,
			accountType,
			amount,
			accountNumber,
			currency,
			routingNumber,
		}: WithdrawDto,
		@Ctx() { dataSources, currentUser }: BankGQLContext,
	): Promise<ApiWithdrawType> {
		// TODO check wallet balance on front end
		// Check if bank account exists
		const myBankAccount = await this.bankAccountRepository.findOne({
			where: {
				ach: {
					routingNumber,
					account: accountNumber,
				},
				userId: currentUser?.userId,
			},
		});
		if (!myBankAccount) {
			return {
				success: false,
				errors: [
					{
						message: ServiceCustomMessage.bankIsNotFound,
						path: 'accountNumber, routingNumber, currentUser',
					},
				],
			};
		}
		// Handle balance check
		let exchangeRate: number = 1;
		if (currency !== myBankAccount.balance.isoCurrencyCode) {
			exchangeRate = await dataSources.exchangeRateApi.exchangeRate[
				`${myBankAccount.balance.isoCurrencyCode?.toLowerCase()}${currency}`
			]();
		}
		// Endpoint: /bank_transfer/migrate_account
		const bfMigrateAccountResponse =
			await dataSources.plaidClient.bankTransferMigrateAccount({
				account_number: accountNumber,
				account_type: accountType,
				routing_number: routingNumber,
			});
		const access_token = bfMigrateAccountResponse.data.access_token;
		// Endpoint: /bank_transfer/create
		const bfCreateResponse =
			await dataSources.plaidClient.bankTransferCreate({
				access_token,
				description: `Withdrawal from ${myBankAccount.name}`,
				amount: (amount * exchangeRate).toString(),
				account_id: myBankAccount.accountId,
				idempotency_key: '',
				network: BankTransferNetwork.Ach,
				iso_currency_code: 'USD',
				// Credit for a transfer of money out of the origination account.
				type: BankTransferType.Credit,
				user: {
					legal_name: accountName,
				},
				ach_class: ACHClass.Ccd,
			});

		//TODO Handle add transaction (Add MQ Wallet)

		return {
			data: bfCreateResponse.data.request_id,
			success: true,
		};
	}
}

export default WithdrawResolver;
