import { Field, InputType } from 'type-graphql';

@InputType()
export class GetBankTransfersDto {
	@Field()
	startDate: string;

	@Field()
	endDate: string;

	@Field()
	count: number;

	@Field()
	offset: number;

	@Field()
	originationAccountId: string;

	@Field()
	direction: string;
}
