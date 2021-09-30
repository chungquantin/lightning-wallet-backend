import { FiatCurrency } from 'neutronpay-wallet-common/dist/shared';
import { Field, InputType } from 'type-graphql';

@InputType()
export class GenerateLightningInvoiceDto {
	@Field()
	amount: number;

	@Field(() => String)
	currency: FiatCurrency;

	@Field(() => String)
	description: string;
}
