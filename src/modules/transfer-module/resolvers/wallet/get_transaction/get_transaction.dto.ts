import { Field, InputType } from 'type-graphql';
@InputType()
export class GetTransactionDto {
	@Field()
	transactionId: string;
}
