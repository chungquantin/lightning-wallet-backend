import { Resolver, Query, UseMiddleware, Arg } from 'type-graphql';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { WalletRepository } from '../../../repository/WalletRepository';
import { Wallet } from '../../../entity';
import {
	ApiArrayResponse,
	PaginationInputType,
} from 'neutronpay-wallet-common/dist/shared';

export const ApiGetWallets = ApiArrayResponse<Wallet>(
	'GetWallets',
	Wallet,
);
export type ApiGetWalletType = InstanceType<typeof ApiGetWallets>;

@Resolver((of) => Wallet)
class GetWalletsResolver {
	@InjectRepository(WalletRepository)
	private readonly walletRepository: WalletRepository;

	@UseMiddleware()
	@Query(() => ApiGetWallets, { nullable: true })
	async getWallets(
		@Arg('Pagination', { nullable: true })
		Pagination?: PaginationInputType,
	): Promise<ApiGetWalletType> {
		const wallets = await this.walletRepository.find();
		return {
			success: true,
			data: wallets.slice(
				Pagination?.skip,
				Pagination?.limit === 0 ? wallets.length : Pagination?.limit,
			),
		};
	}
}

export default GetWalletsResolver;
