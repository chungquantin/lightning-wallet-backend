import { Resolver, Mutation, Arg, UseMiddleware } from 'type-graphql';
import { ApiResponse } from 'neutronpay-wallet-common/dist/shared';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { BankAccountRepository } from '../../../repository/BankAccountRepository';
import { DeleteBankAccountDto } from './delete_bank_account.dto';
import { BankAccount } from '../../../entity';
import { isAuth } from 'neutronpay-wallet-common/dist/middleware';

export const ApiDeleteBankAccount = ApiResponse<String>(
	'DeleteBankAccount',
	String,
);
export type ApiDeleteBankAccountType = InstanceType<
	typeof ApiDeleteBankAccount
>;

@Resolver((of) => BankAccount)
class DeleteBankAccountResolver {
	@InjectRepository(BankAccountRepository)
	private readonly bankAccountRepository: BankAccountRepository;

	@UseMiddleware(isAuth)
	@Mutation(() => ApiDeleteBankAccount, { nullable: true })
	async deleteBankAccount(
		@Arg('data') { bankAccountId }: DeleteBankAccountDto,
	): Promise<ApiDeleteBankAccountType> {
		try {
			await this.bankAccountRepository.delete({
				id: bankAccountId,
			});
			return {
				success: true,
				data: `Bank account ${bankAccountId} is deleted successfully`,
			};
		} catch (error) {
			return {
				success: false,
				errors: [
					{
						path: 'deleteBankAccount',
						message: error.message,
					},
				],
			};
		}
	}
}

export default DeleteBankAccountResolver;
