import { Resolver, Mutation, Ctx, Arg } from 'type-graphql';
import { ApiResponse } from 'neutronpay-wallet-common/dist/shared';
import { BankAccount } from '../../../entity';
import { BankGQLContext } from '../../../server';
import { DepositDto } from './deposit.dto';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { BankAccountRepository } from '../../../repository';
import { ServiceCustomMessage } from '../../../constants/CustomMessage';
import {
	ACHClass,
	BankTransferNetwork,
	BankTransferType,
} from 'plaid';

export const ApiDeposit = ApiResponse<String>('Deposit', String);
export type ApiDepositType = InstanceType<typeof ApiDeposit>;

/**
 * Deposit - Transferring funds in (Bank account -> FBO)
 * @url https://plaid.com/docs/bank-transfers/#transferring-funds-in
 *	@author chungquantin
 */
@Resolver((of) => BankAccount)
class DepositResolver {
	@InjectRepository(BankAccountRepository)
	private readonly bankAccountRepository: BankAccountRepository;

	@Mutation(() => ApiDeposit, { nullable: true })
	async deposit(
		@Arg('data')
		{
			accountNumber,
			accountType,
			accountName,
			routingNumber,
			amount,
			currency,
		}: DepositDto,
		@Ctx()
		{ dataSources, currentUser }: BankGQLContext,
	): Promise<ApiDepositType> {
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
		if (
			exchangeRate * amount <=
			myBankAccount.balance.currentBalance
		) {
			return {
				success: false,
				errors: [
					{
						path: 'amount',
						message: ServiceCustomMessage.amountIsNotValid,
					},
				],
			};
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
				description: `Deposit from ${myBankAccount.name}`,
				amount: (amount * exchangeRate).toString(),
				account_id: myBankAccount.accountId,
				idempotency_key: '',
				network: BankTransferNetwork.Ach,
				iso_currency_code: 'USD',
				// Debit for a transfer of money into the origination account
				type: BankTransferType.Debit,
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

export default DepositResolver;
