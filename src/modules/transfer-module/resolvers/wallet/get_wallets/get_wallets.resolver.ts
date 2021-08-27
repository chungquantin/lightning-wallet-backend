import { Resolver, Query, UseMiddleware } from 'type-graphql';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { WalletRepository } from '../../../repository/wallet/WalletRepository';
import { ApiArrayResponse } from '../../../../../common/shared';
import { Wallet } from '../../../entity';

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
	async getWallets(): Promise<ApiGetWalletType> {
		const wallets = await this.walletRepository.find();
		return {
			success: true,
			data: wallets,
		};
	}
}

export default GetWalletsResolver;
