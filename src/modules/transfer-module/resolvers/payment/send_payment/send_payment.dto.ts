import { Field, InputType } from 'type-graphql';
import { FiatCurrency, TransactionMethod } from '../../../constants';
@InputType()
export class SendPaymentDto {
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
