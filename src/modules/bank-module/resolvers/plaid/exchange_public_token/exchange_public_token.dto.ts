import { Field, InputType } from 'type-graphql';

@InputType()
export class ExchangeTokenDto {
	@Field()
	publicToken: string;
}
