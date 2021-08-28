import { Field, InputType } from 'type-graphql';

@InputType()
export class LndSendPaymentDto {
	@Field()
	paymentRequest: string;
}
