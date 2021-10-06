import { Directive, Field, ID, ObjectType } from 'type-graphql';
import {
	Entity,
	PrimaryColumn,
	BaseEntity,
	Column,
	BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Directive('@key(fields: "institutionId")')
@ObjectType('InstitutionSchema')
@Entity('Institution')
export class Institution extends BaseEntity {
	@Field(() => ID)
	@PrimaryColumn('uuid')
	id: string;

	@Field(() => String!)
	@Column('text')
	institutionId: string;

	@Field(() => String!)
	@Column('text')
	institutionName: string;

	@Field(() => String, { nullable: true })
	@Column('text', { nullable: true })
	institutionLogo: string | null | undefined;

	@Field(() => String, { nullable: true })
	@Column('text', { nullable: true })
	primaryColor: string | null | undefined;

	@Field(() => String, { nullable: true })
	@Column('text', { nullable: true })
	websiteUrl: string | null | undefined;

	@BeforeInsert()
	async addId() {
		this.id = uuidv4();
	}
}
