import {
	Arg,
	Resolver,
	Mutation,
	Ctx,
	UseMiddleware,
} from 'type-graphql';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { ApiResponse } from 'neutronpay-wallet-common/dist/shared';
import { isAuth } from 'neutronpay-wallet-common/dist/middleware';
import { AddInvoice } from '../../../node';
import {
	ChainInvoiceRepository,
	LightningInvoiceRepository,
} from '../../../repository';
import { LndGQLContext } from '../../../server';
import { LightningInvoice } from '../../../entity';
import { GenerateLightningInvoiceDto } from './generate_lightning_invoice.dto';

export const ApiGenerateLightningInvoiceResponse =
	ApiResponse<LightningInvoice>(
		'GenerateLightningInvoice',
		LightningInvoice,
	);
export type ApiGenerateLightningInvoiceResponseType = InstanceType<
	typeof ApiGenerateLightningInvoiceResponse
>;

@Resolver((of) => LightningInvoice)
class GenerateLightningInvoiceResolver {
	@InjectRepository(LightningInvoiceRepository)
	private readonly lightningInvoiceRepository: LightningInvoiceRepository;

	@UseMiddleware(isAuth)
	@Mutation(() => ApiGenerateLightningInvoiceResponse, {
		nullable: true,
	})
	async generateLightningInvoice(
		@Arg('data')
		{ amount, description, currency }: GenerateLightningInvoiceDto,
		@Ctx()
		{ currentUser, dataSources }: LndGQLContext,
	): Promise<ApiGenerateLightningInvoiceResponseType> {
		const exchangeRate =
			await dataSources.exchangeRateApi.exchangeRate[
				`btc${currency}`
			]();
		const btcAmount = (1 / exchangeRate) * amount;
		const lightningData = await AddInvoice(description, btcAmount);
		if (!lightningData) {
			return {
				success: false,
				errors: [
					{
						path: 'Node.AddInvoice()',
						message: 'Cannot create lightning data',
					},
				],
			};
		}
		const lightningInvoice = this.lightningInvoiceRepository.create({
			payReq: lightningData.paymentAddr.toString(),
			addIndex: lightningData.addIndex.toString(),
			userId: currentUser?.userId,
		});
		lightningInvoice.save();

		return { success: true, data: lightningInvoice };
	}
}

export default GenerateLightningInvoiceResolver;
