import { Field, InputType } from 'type-graphql';

@InputType()
export class SendLightningPaymentDto {
	@Field()
	paymentRequest: string;
}
