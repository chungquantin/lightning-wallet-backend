import { Resolver, Query, Ctx, UseMiddleware } from 'type-graphql';
import { ApiArrayResponse } from 'neutronpay-wallet-common/dist/shared';
import { BankAccount } from '../../../entity';
import { BankAccountRepository } from '../../../repository/BankAccountRepository';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { BankGQLContext } from '../../../server';
import { isAuth } from 'neutronpay-wallet-common/dist/middleware';

export const ApiGetMyBankAccounts = ApiArrayResponse<BankAccount>(
	'GetMyBankAccounts',
	BankAccount,
);
export type ApiGetMyBankAccountsType = InstanceType<
	typeof ApiGetMyBankAccounts
>;

@Resolver((of) => BankAccount)
class GetMyBankAccountsResolver {
	@InjectRepository(BankAccountRepository)
	private readonly bankAccountRepository: BankAccountRepository;

	@UseMiddleware(isAuth)
	@Query(() => ApiGetMyBankAccounts, { nullable: true })
	async getMyBankAccounts(
		@Ctx() { currentUser }: BankGQLContext,
	): Promise<ApiGetMyBankAccountsType> {
		const bankAccounts = await this.bankAccountRepository.find({
			where: {
				userId: currentUser?.userId,
			},
			relations: ['balance', 'ach'],
		});
		return {
			success: true,
			data: bankAccounts,
		};
	}
}

export default GetMyBankAccountsResolver;
