import { Resolver, Query } from 'type-graphql';
import { ApiArrayResponse } from 'neutronpay-wallet-common/dist/shared';
import { BankAccount } from '../../../entity';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { BankAccountRepository } from '../../../repository';

export const ApiGetBankAccounts = ApiArrayResponse<BankAccount>(
	'GetBankAccounts',
	BankAccount,
);
export type ApiGetBankAccountsType = InstanceType<
	typeof ApiGetBankAccounts
>;

@Resolver((of) => BankAccount)
class GetBankAccountsResolver {
	@InjectRepository(BankAccountRepository)
	private readonly bankAccountRepository: BankAccountRepository;

	@Query(() => ApiGetBankAccounts, { nullable: true })
	async getBankAccounts(): Promise<ApiGetBankAccountsType> {
		const bankAccounts = await this.bankAccountRepository.find({
			relations: ['balance', 'ach', 'institution'],
		});
		return {
			success: true,
			data: bankAccounts,
		};
	}
}

export default GetBankAccountsResolver;
