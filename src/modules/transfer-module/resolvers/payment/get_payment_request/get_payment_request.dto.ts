import { Field, InputType } from 'type-graphql';
@InputType()
export class GetPaymentRequestDto {
	@Field()
	paymentRequestId: string;
}
