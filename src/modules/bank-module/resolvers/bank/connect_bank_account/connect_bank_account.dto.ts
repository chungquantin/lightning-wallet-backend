import { Field, InputType } from 'type-graphql';

@InputType()
export class ConnectBankAccountDto {
	@Field({ description: 'account id [Plaid]' })
	accountId: string;

	@Field()
	publicToken: string;

	@Field()
	institutionId: string;

	@Field()
	institutionName: string;
}
