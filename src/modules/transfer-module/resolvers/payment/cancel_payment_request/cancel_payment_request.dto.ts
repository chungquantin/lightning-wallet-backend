import { Field, InputType } from 'type-graphql';
@InputType()
export class CancelPaymentRequestDto {
	@Field()
	paymentRequestId: string;
}
