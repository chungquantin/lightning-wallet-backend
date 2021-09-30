import { Resolver, Query, Arg, Ctx } from 'type-graphql';
import { ApiArrayResponse } from 'neutronpay-wallet-common/dist/shared';
import { BankAccount } from '../../../entity';
import { BankGQLContext } from '../../../server';
import { BankTransfer } from '../../../constants/BankTransfer';
import { GetBankTransfersDto } from './get_bank_transfers.dto';

export const ApiGetBankTransfers = ApiArrayResponse<BankTransfer>(
	'GetBankTransfers',
	BankTransfer,
);
export type ApiGetBankTransfersType = InstanceType<
	typeof ApiGetBankTransfers
>;

@Resolver((of) => BankAccount)
class GetBankTransfersResolver {
	@Query(() => ApiGetBankTransfers, { nullable: true })
	async getBankTransfers(
		@Ctx() { dataSources }: BankGQLContext,
		@Arg('data')
		{
			count,
			direction,
			endDate,
			offset,
			originationAccountId,
			startDate,
		}: GetBankTransfersDto,
	): Promise<ApiGetBankTransfersType> {
		const {
			data: { bank_transfers },
		} = await dataSources.plaidClient.bankTransferList({
			count,
			direction: direction as any,
			end_date: endDate,
			offset,
			start_date: startDate,
			origination_account_id: originationAccountId,
		});
		return {
			success: true,
			data: bank_transfers.map((bank_transfer) => ({
				account_id: bank_transfer.account_id,
				ach_class: bank_transfer.ach_class,
				amount: bank_transfer.amount,
				cancellable: bank_transfer.cancellable,
				currency: bank_transfer.iso_currency_code,
				created: bank_transfer.created,
				customTag: bank_transfer.custom_tag as string,
				description: bank_transfer.description,
				direction: bank_transfer.direction as string,
				failure_reason: bank_transfer.failure_reason
					?.description as string,
				id: bank_transfer.id,
				legalName: bank_transfer.user.legal_name,
				network: bank_transfer.network,
				status: bank_transfer.status,
				originationAccountId: bank_transfer.origination_account_id,
				type: bank_transfer.type,
			})),
		};
	}
}

export default GetBankTransfersResolver;
