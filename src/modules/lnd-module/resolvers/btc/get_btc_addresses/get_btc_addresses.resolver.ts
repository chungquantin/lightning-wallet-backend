import { Resolver, Query, ObjectType, Field } from 'type-graphql';
import { ApiResponse } from 'neutronpay-wallet-common/dist/shared';
import { ChainInvoice, LightningInvoice } from '../../../entity';
import {
	ChainInvoiceRepository,
	LightningInvoiceRepository,
} from '../../../repository';
import { InjectRepository } from 'typeorm-typedi-extensions';

@ObjectType()
class BtcAddresses {
	@Field(() => [LightningInvoice])
	lightningInvoices: LightningInvoice[];

	@Field(() => [ChainInvoice])
	chainInvoices: ChainInvoice[];
}

export const ApiGetBtcAddresses = ApiResponse<BtcAddresses>(
	'getBtcAddresses',
	BtcAddresses,
);
export type ApiGetBtcAddressesType = InstanceType<
	typeof ApiGetBtcAddresses
>;

@Resolver((of) => BtcAddresses)
class GetBtcAddressesResolver {
	@InjectRepository(ChainInvoiceRepository)
	private readonly chainInvoiceRepository: ChainInvoiceRepository;
	@InjectRepository(LightningInvoiceRepository)
	private readonly lightningInvoiceRepository: LightningInvoiceRepository;

	@Query(() => ApiGetBtcAddresses, { nullable: true })
	async getBtcAddresses(): Promise<ApiGetBtcAddressesType> {
		return {
			success: true,
			data: {
				chainInvoices: await this.chainInvoiceRepository.find(),
				lightningInvoices:
					await this.lightningInvoiceRepository.find(),
			},
		};
	}
}

export default GetBtcAddressesResolver;