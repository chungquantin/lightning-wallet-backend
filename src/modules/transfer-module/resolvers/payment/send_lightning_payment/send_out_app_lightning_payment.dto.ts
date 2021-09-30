import { Field, InputType } from 'type-graphql';
import { FiatCurrency, TransactionMethod } from '../../../constants';

@InputType()
export class SendOutAppLightningPaymentDto {
	@Field()
	paymentRequest: string;

	@Field()
	description: string;
}
