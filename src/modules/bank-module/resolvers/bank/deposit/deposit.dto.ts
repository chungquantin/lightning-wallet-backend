import { FiatCurrency } from 'neutronpay-wallet-common/dist/shared';
import { Field, InputType } from 'type-graphql';

@InputType()
export class DepositDto {
	@Field({ description: "The user's account number." })
	accountNumber: string;

	@Field({ description: "The user's routing number." })
	routingNumber: string;

	@Field({
		description:
			'The type of the bank account (checking or savings).',
	})
	accountType: 'checking' | 'savings';

	@Field()
	accountName: string;

	@Field()
	amount: number;

	@Field()
	currency: FiatCurrency;
}
