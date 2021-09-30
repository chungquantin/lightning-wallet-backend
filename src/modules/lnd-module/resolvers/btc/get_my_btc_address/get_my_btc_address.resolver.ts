import {
	Resolver,
	Query,
	ObjectType,
	Field,
	Ctx,
} from 'type-graphql';
import { ApiResponse } from 'neutronpay-wallet-common/dist/shared';
import { ChainInvoice, LightningInvoice } from '../../../entity';
import {
	ChainInvoiceRepository,
	LightningInvoiceRepository,
} from '../../../repository';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { LndGQLContext } from '../../../server';

@ObjectType()
class BtcAddress {
	@Field(() => LightningInvoice)
	lightningInvoice: LightningInvoice;

	@Field(() => ChainInvoice)
	chainInvoice: ChainInvoice;
}

export const ApiGetBtcAddress = ApiResponse<BtcAddress>(
	'getBtcAddress',
	BtcAddress,
);
export type ApiGetBtcAddressType = InstanceType<
	typeof ApiGetBtcAddress
>;

@Resolver((of) => BtcAddress)
class GetBtcAddressResolver {
	@InjectRepository(ChainInvoiceRepository)
	private readonly chainInvoiceRepository: ChainInvoiceRepository;
	@InjectRepository(LightningInvoiceRepository)
	private readonly lightningInvoiceRepository: LightningInvoiceRepository;

	@Query(() => ApiGetBtcAddress, { nullable: true })
	async getBtcAddress(
		@Ctx() { currentUser }: LndGQLContext,
	): Promise<ApiGetBtcAddressType> {
		const chainInvoice = await this.chainInvoiceRepository.findOne({
			where: {
				userId: currentUser?.userId,
			},
			order: { id: 'DESC' },
		});
		if (!chainInvoice) {
			return {
				success: false,
				errors: [
					{
						message: 'Chain invoice does not found',
					},
				],
			};
		}
		const lightningInvoice =
			await this.lightningInvoiceRepository.findOne({
				where: {
					userId: currentUser?.userId,
				},
				order: { id: 'DESC' },
			});
		if (!lightningInvoice) {
			return {
				success: false,
				errors: [
					{
						message: 'Lightning invoice does not found',
					},
				],
			};
		}
		return {
			success: true,
			data: {
				chainInvoice,
				lightningInvoice,
			},
		};
	}
}

export default GetBtcAddressResolver;
