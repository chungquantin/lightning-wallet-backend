import { Resolver, Query, UseMiddleware, Arg } from 'type-graphql';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { WalletRepository } from '../../../repository/WalletRepository';
import {
	ApiResponse,
	CustomMessage,
} from '../../../../../common/shared';
import { Wallet } from '../../../entity';
import { GetWalletDto } from './get_wallet.dto';

export const ApiGetWallet = ApiResponse<Wallet>('GetWallet', Wallet);
export type ApiGetWalletType = InstanceType<typeof ApiGetWallet>;

@Resolver((of) => Wallet)
class GetWalletResolver {
	@InjectRepository(WalletRepository)
	private readonly walletRepository: WalletRepository;

	@UseMiddleware()
	@Query(() => ApiGetWallet, { nullable: true })
	async getWallet(
		@Arg('data') { userId }: GetWalletDto,
	): Promise<ApiGetWalletType> {
		const wallet = await this.walletRepository.findOne({
			where: {
				userId: userId,
			},
			relations: ['transactions'],
		});
		if (!wallet) {
			return {
				success: false,
				errors: [
					{
						path: 'userId',
						message: CustomMessage.walletIsNotFound,
					},
				],
			};
		}
		return {
			success: true,
			data: wallet,
		};
	}
}

export default GetWalletResolver;
