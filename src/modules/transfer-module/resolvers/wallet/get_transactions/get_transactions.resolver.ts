import { Resolver, Query, Arg } from 'type-graphql';
import { InjectRepository } from 'typeorm-typedi-extensions';
import {
	ApiArrayResponse,
	PaginationInputType,
} from 'neutronpay-wallet-common/dist/shared';
import { TransactionRepository } from '../../../repository';
import { Transaction } from '../../../entity/Transaction';

export const ApiGetTransactionsResponse =
	ApiArrayResponse<Transaction>('GetTransactions', Transaction);
export type ApiGetTransactionsResponseType = InstanceType<
	typeof ApiGetTransactionsResponse
>;

@Resolver((of) => Transaction)
class GetTransactionsResolver {
	@InjectRepository(TransactionRepository)
	private readonly transactionRepository: TransactionRepository;

	@Query(() => ApiGetTransactionsResponse!, {
		nullable: true,
	})
	async getTransactions(
		@Arg('Pagination', { nullable: true })
		Pagination?: PaginationInputType,
	): Promise<ApiGetTransactionsResponseType> {
		const transactions = await this.transactionRepository.find();
		return {
			success: true,
			data:
				transactions.slice(
					Pagination?.skip,
					Pagination?.limit === 0
						? transactions.length
						: Pagination?.limit,
				) || [],
		};
	}
}

export default GetTransactionsResolver;
