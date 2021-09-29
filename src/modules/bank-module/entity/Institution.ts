import { Directive, Field, ObjectType } from 'type-graphql';
import { Entity, PrimaryColumn, BaseEntity, Column } from 'typeorm';

@Directive('@key(fields: "institutionId")')
@ObjectType('InstitutionSchema')
@Entity('Institution')
export class Institution extends BaseEntity {
	@Field(() => String!)
	@PrimaryColumn('text')
	institutionId: string;

	@Field(() => String!)
	@Column('text')
	institutionName: string;

	@Field(() => String, { nullable: true })
	@Column('text')
	institutionLogo: string | null | undefined;

	@Field(() => String, { nullable: true })
	@Column('text')
	primaryColor: string | null | undefined;

	@Field(() => String, { nullable: true })
	@Column('text')
	websiteUrl: string | null | undefined;
}
