import { Field, InputType } from 'type-graphql';

@InputType()
export class GetBankAccountDto {
	@Field()
	bankAccountId: string;
}
