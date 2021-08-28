import {
	Field,
	InputType,
	Int,
	registerEnumType,
} from 'type-graphql';

export enum DirectionEnum {
	DESC = 'desc',
	ASC = 'asc',
}

registerEnumType(DirectionEnum, {
	name: 'DirectionEnum', // this one is mandatory
	description: 'Direction', // this one is optional
});

@InputType()
export class OrderByInputType {
	@Field()
	fieldName: string;

	@Field()
	direction: DirectionEnum;
}

@InputType()
export class PaginationInputType {
	@Field(() => Int, { defaultValue: 0 })
	limit: number;

	@Field(() => Int, { defaultValue: 0 })
	skip: number;
}
