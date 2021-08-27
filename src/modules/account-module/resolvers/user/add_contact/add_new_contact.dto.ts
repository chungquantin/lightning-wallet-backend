import { Field, InputType } from 'type-graphql';
@InputType()
export class AddNewContactDto {
	@Field()
	userId: string;
}
