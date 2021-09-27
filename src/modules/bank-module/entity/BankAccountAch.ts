import { Directive, Field, ID, ObjectType } from 'type-graphql';
import {
	Entity,
	PrimaryColumn,
	BeforeInsert,
	BaseEntity,
	Column,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Directive('@key(fields: "id")')
@ObjectType('BankAccountAchSchema')
@Entity('BankAccountAch')
export class BankAccountAch extends BaseEntity {
	@Field(() => ID)
	@PrimaryColumn('uuid')
	id: string;

	@Field(() => String!)
	@Column('text')
	routingNumber: string;

	@Field(() => String!)
	@Column('text')
	account: string;

	@Field(() => String!)
	@Column('text')
	wire_routing: string;

	@BeforeInsert()
	async addId() {
		this.id = uuidv4();
	}
}
