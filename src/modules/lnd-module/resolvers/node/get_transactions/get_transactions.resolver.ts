import {
	Resolver,
	UseMiddleware,
	ObjectType,
	Field,
	Query,
	Arg,
} from 'type-graphql';
import { ApiArrayResponse } from '../../../../../common/shared';
import {
	OrderByInputType,
	PaginationInputType,
} from '../../../../../common/shared/Pagination';
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

export const ApiGetTransactions =
	ApiArrayResponse<LightningTransaction>(
		'LndGetTransactions',
		LightningTransaction,
	);
export type ApiGetTransactionsType = InstanceType<
	typeof ApiGetTransactions
>;

@Resolver((of) => String)
class LndGetTransactionsResolver {
	@UseMiddleware()
	@Query(() => ApiGetTransactions, { nullable: true })
	async lndGetTransactions(
		@Arg('Pagination', { nullable: true })
		Pagination?: PaginationInputType,
	): Promise<ApiGetTransactionsType> {
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
						path: 'lndSendPayment',
					},
				],
			};
		}
	}
}

export default LndGetTransactionsResolver;
