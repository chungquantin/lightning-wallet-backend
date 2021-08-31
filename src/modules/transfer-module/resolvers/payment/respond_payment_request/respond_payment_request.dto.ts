import { Field, InputType } from 'type-graphql';

@InputType()
export class RespondPaymentRequestDto {
	@Field()
	paymentRequestId: string;

	@Field()
	confirmed: boolean;
}
