import {
	Resolver,
	Mutation,
	Ctx,
	Arg,
	UseMiddleware,
} from 'type-graphql';
import { ApiResponse } from 'neutronpay-wallet-common/dist/shared';
import { BankGQLContext } from '../../../server';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { ConnectBankAccountDto } from './connect_bank_account.dto';
import { isAuth } from 'neutronpay-wallet-common/dist/middleware';
import { BankAccountRepository } from '../../../repository/BankAccountRepository';
import { BankAccountBalanceRepository } from '../../../repository/BankAccountBalance';
import { BankAccountAchRepository } from '../../../repository/BankAccountAchRepository';
import {
	BankAccount,
	BankAccountAch,
	BankAccountBalance,
} from '../../../entity';

export const ApiConnectBankAccount = ApiResponse<String>(
	'ConnectBankAccount',
	String,
);
export type ApiConnectBankAccountType = InstanceType<
	typeof ApiConnectBankAccount
>;

@Resolver((of) => BankAccount)
class ConnectBankAccountResolver {
	@InjectRepository(BankAccountRepository)
	private readonly bankAccountRepository: BankAccountRepository;
	@InjectRepository(BankAccountBalanceRepository)
	private readonly bankAccountBalanceRepository: BankAccountBalanceRepository;
	@InjectRepository(BankAccountAchRepository)
	private readonly bankAccountAchRepository: BankAccountAchRepository;

	@UseMiddleware(isAuth)
	@Mutation(() => ApiConnectBankAccount, { nullable: true })
	async connectBankAccount(
		@Ctx()
		{ dataSources: { plaidClient }, currentUser }: BankGQLContext,
		@Arg('data')
		{
			accountId,
			publicToken,
			institutionId,
			institutionName,
		}: ConnectBankAccountDto,
	): Promise<ApiConnectBankAccountType> {
		try {
			let scopedAch: BankAccountAch;
			let scopedBalance: BankAccountBalance;
			const {
				data: { access_token },
			} = await plaidClient.itemPublicTokenExchange({
				public_token: publicToken,
			});
			const authResponse = await plaidClient.authGet({
				access_token,
			});

			const createdBankAccount =
				await this.bankAccountRepository.create({
					accountId: accountId,
				});

			const achList = authResponse.data.numbers.ach;
			achList.forEach(async (ach) => {
				if (ach.account_id === accountId) {
					// Handle add bank account
					scopedAch = await this.bankAccountAchRepository.create({
						account: ach.account as string,
						routingNumber: ach.routing as string,
						wire_routing: ach.wire_routing as string,
					});
					createdBankAccount.ach = scopedAch;
				}
			});

			const accountList = authResponse.data.accounts;
			accountList.forEach(async (account) => {
				// Handle add bank account
				if (account.account_id === accountId) {
					const balance = account.balances;
					scopedBalance =
						await this.bankAccountBalanceRepository.create({
							availableBalance: balance.available as number,
							currentBalance: balance.current as number,
							limitBalance: balance.limit as number,
							unofficialCurrencyCode:
								balance.unofficial_currency_code as string,
							isoCurrencyCode: balance.iso_currency_code as string,
						});
					createdBankAccount.balance = scopedBalance;
					createdBankAccount.accountId = accountId;
					createdBankAccount.userId = currentUser?.userId as string;
					createdBankAccount.name = account.name;
					createdBankAccount.subType =
						account?.subtype?.toString() as string;
					createdBankAccount.officialName =
						account?.official_name?.toString() as string;
					createdBankAccount.type = account.type as any;
					createdBankAccount.institutionId = institutionId;
					createdBankAccount.institutionName = institutionName;
				}
			});

			createdBankAccount.save().then(() => {
				scopedBalance.save();
				scopedBalance.save();
			});
			return {
				data: 'Bank connected!',
				success: true,
			};
		} catch (error) {
			return {
				success: false,
				errors: [
					{
						message: error.message,
						path: 'connectBankAccount',
					},
				],
			};
		}
	}
}

export default ConnectBankAccountResolver;
