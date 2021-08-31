import {
	Resolver,
	UseMiddleware,
	ObjectType,
	Field,
	Query,
	Arg,
} from 'type-graphql';
import { ApiArrayResponse } from 'neutronpay-wallet-common/dist/shared';
import { PaginationInputType } from 'neutronpay-wallet-common/dist/shared/Pagination';
import { GetTransactions } from '../../../node';

@ObjectType()
class LightningTransaction {
	@Field()
	amount: number;

	@Field()
	hash: string;

	@Field()
	fees: number;

	@Field()
	blockHash: string;

	@Field()
	timeStamp: number;
}

export const ApiGetLightningTransactions =
	ApiArrayResponse<LightningTransaction>(
		'LndGetTransactions',
		LightningTransaction,
	);
export type ApiGetLightningTransactionsType = InstanceType<
	typeof ApiGetLightningTransactions
>;

@Resolver((of) => String)
class LightningGetTransactionsResolver {
	@UseMiddleware()
	@Query(() => ApiGetLightningTransactions, { nullable: true })
	async lightningGetTransactions(
		@Arg('Pagination', { nullable: true })
		Pagination?: PaginationInputType,
	): Promise<ApiGetLightningTransactionsType> {
		try {
			const response = await GetTransactions();
			return {
				success: true,
				data:
					response?.transactions
						.slice(
							Pagination?.skip,
							Pagination?.limit === 0
								? response.transactions.length
								: Pagination?.limit,
						)
						.map((transaction) => ({
							amount: transaction.amount,
							hash: transaction.tx_hash,
							fees: transaction.total_fees,
							blockHash: transaction.block_hash,
							timeStamp: transaction.time_stamp,
						})) || [],
			};
		} catch (err) {
			return {
				success: false,
				data: [],
				errors: [
					{
						message: err.message,
						path: 'lightningSendPayment',
					},
				],
			};
		}
	}
}

export default LightningGetTransactionsResolver;
