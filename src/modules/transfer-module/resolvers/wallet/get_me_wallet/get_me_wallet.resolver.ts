import { Resolver, Query, UseMiddleware, Ctx } from 'type-graphql';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { WalletRepository } from '../../../repository/WalletRepository';
import {
	ApiResponse,
	CustomMessage,
} from '../../../../../common/shared';
import { GQLContext } from '../../../../../common/utils/graphql-utils';
import { Wallet } from '../../../entity';

export const ApiGetMeWallet = ApiResponse<Wallet>(
	'GetMeWallet',
	Wallet,
);
export type ApiGetMeWalletType = InstanceType<typeof ApiGetMeWallet>;

@Resolver((of) => Wallet)
class GetMeWalletResolver {
	@InjectRepository(WalletRepository)
	private readonly walletRepository: WalletRepository;

	@UseMiddleware()
	@Query(() => ApiGetMeWallet, { nullable: true })
	async getMeWallet(
		@Ctx() { currentUser }: GQLContext,
	): Promise<ApiGetMeWalletType> {
		const wallet = await this.walletRepository.findOne({
			where: {
				userId: currentUser?.userId,
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

export default GetMeWalletResolver;
