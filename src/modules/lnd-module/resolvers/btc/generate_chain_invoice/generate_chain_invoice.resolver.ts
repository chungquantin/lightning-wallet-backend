import { Resolver, Mutation, Ctx, UseMiddleware } from 'type-graphql';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { ApiResponse } from 'neutronpay-wallet-common/dist/shared';
import { isAuth } from 'neutronpay-wallet-common/dist/middleware';
import { NewAddress } from '../../../node';
import { ChainInvoiceRepository } from '../../../repository';
import { LndGQLContext } from '../../../server';
import { ChainInvoice } from '../../../entity';

export const ApiGenerateChainInvoiceResponse =
	ApiResponse<ChainInvoice>('GenerateChainInvoice', ChainInvoice);
export type ApiGenerateChainInvoiceResponseType = InstanceType<
	typeof ApiGenerateChainInvoiceResponse
>;

@Resolver((of) => ChainInvoice)
class GenerateChainInvoiceResolver {
	@InjectRepository(ChainInvoiceRepository)
	private readonly chainInvoiceRepository: ChainInvoiceRepository;

	@UseMiddleware(isAuth)
	@Mutation(() => ApiGenerateChainInvoiceResponse, { nullable: true })
	async generateOnChainInvoice(
		@Ctx()
		{ currentUser }: LndGQLContext,
	): Promise<ApiGenerateChainInvoiceResponseType> {
		const chainData = await NewAddress();
		if (!chainData) {
			return {
				success: false,
				errors: [
					{
						path: 'Node.NewAddress()',
						message: 'Cannot create chain data',
					},
				],
			};
		}
		const chainInvoice = await this.chainInvoiceRepository.create({
			address: chainData.address,
			userId: currentUser?.userId,
		});
		return {
			success: true,
			data: chainInvoice,
		};
	}
}

export default GenerateChainInvoiceResolver;
