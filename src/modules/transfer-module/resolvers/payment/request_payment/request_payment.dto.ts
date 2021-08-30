import { Field, InputType } from 'type-graphql';
import { FiatCurrency } from 'neutronpay-wallet-common/dist/shared';
import { TransactionMethod } from 'neutronpay-wallet-common/dist/shared/TransactionMethod.enum';
@InputType()
export class RequestPaymentDto {
	@Field()
	walletId: string;

	@Field()
	amount: number;

	@Field()
	currency: FiatCurrency;

	@Field()
	method: TransactionMethod;

	@Field()
	description: string;
}
