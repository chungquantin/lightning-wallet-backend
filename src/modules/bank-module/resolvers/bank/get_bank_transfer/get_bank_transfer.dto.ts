import { Field, InputType } from 'type-graphql';

@InputType()
export class GetBankTransferDto {
	@Field()
	bankTransferId: string;
}
