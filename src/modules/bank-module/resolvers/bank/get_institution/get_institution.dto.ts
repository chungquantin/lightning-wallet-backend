import { Field, InputType } from 'type-graphql';

@InputType()
export class GetInstitutionDto {
	@Field()
	institutionId: string;
}
