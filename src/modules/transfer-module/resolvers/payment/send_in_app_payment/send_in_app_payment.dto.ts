import { Field, InputType } from 'type-graphql';
import { FiatCurrency, TransactionMethod } from '../../../constants';
@InputType()
export class SendInAppPaymentDto {
	@Field(() => String, { nullable: true })
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
