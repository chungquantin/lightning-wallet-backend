import { Field, InputType } from 'type-graphql';

@InputType()
export class SendInAppLightningPaymentDto {
	@Field()
	paymentRequest: string;

	@Field()
	walletId: string;

	@Field()
	description: string;
}
