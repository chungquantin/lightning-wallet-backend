import {
	Resolver,
	Ctx,
	UseMiddleware,
	Query,
	Arg,
} from 'type-graphql';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { GQLContext } from '../../../../../common/utils/graphql-utils';
import { isAuth } from '../../../../../common/middleware/isAuth';
import {
	ApiArrayResponse,
	CustomMessage,
} from '../../../../../common/shared';
import { PaginationInputType } from '../../../../../common/shared/Pagination';
import { WalletRepository } from '../../../repository';
import { Transaction } from '../../../entity/Transaction';

export const ApiGetMyWalletTransactionsResponse =
	ApiArrayResponse<Transaction>(
		'GetMyWalletTransactions',
		Transaction,
	);
export type ApiGetMyWalletTransactionsResponseType = InstanceType<
	typeof ApiGetMyWalletTransactionsResponse
>;

@Resolver((of) => Transaction)
class GetMyWalletTransactionsResolver {
	@InjectRepository(WalletRepository)
	private readonly walletRepository: WalletRepository;

	@UseMiddleware(isAuth)
	@Query(() => ApiGetMyWalletTransactionsResponse!, {
		nullable: true,
	})
	async getMyWalletTransactions(
		@Ctx() { currentUser }: GQLContext,
		@Arg('Pagination', { nullable: true })
		Pagination?: PaginationInputType,
	): Promise<ApiGetMyWalletTransactionsResponseType> {
		const wallet = await this.walletRepository.findOne({
			where: { userId: currentUser?.userId },
			relations: ['transactions'],
		});

		if (!wallet) {
			return {
				success: false,
				errors: [
					{
						path: 'currentUser',
						message: CustomMessage.walletIsNotFound,
					},
				],
				data: [],
			};
		}

		const transactions = wallet.transactions;

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

export default GetMyWalletTransactionsResolver;
