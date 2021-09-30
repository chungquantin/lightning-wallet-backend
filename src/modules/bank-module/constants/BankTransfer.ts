import { Field, ObjectType } from 'type-graphql';

@ObjectType()
export class BankTransfer {
	@Field()
	account_id: string;

	@Field()
	ach_class: string;

	@Field()
	amount: string;

	@Field()
	cancellable: boolean;

	@Field()
	created: string;

	@Field()
	customTag: string;

	@Field()
	description: string;

	@Field()
	direction: string;

	@Field()
	failure_reason: string;

	@Field()
	id: string;

	@Field()
	currency: string;

	@Field()
	network: string;

	@Field()
	originationAccountId: string;

	@Field()
	status: string;

	@Field()
	type: string;

	@Field()
	legalName: string;
}
