import { Directive, Field, ID, ObjectType } from 'type-graphql';
import {
	Entity,
	PrimaryColumn,
	BeforeInsert,
	BaseEntity,
	Column,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as moment from 'moment';

@Directive('@key(fields: "id")')
@ObjectType('ChainInvoiceSchema')
@Entity('ChainInvoice')
export class ChainInvoice extends BaseEntity {
	@Field(() => ID)
	@PrimaryColumn('uuid')
	id: string;

	@Field(() => String!)
	@Column('text')
	userId: string;

	@Field(() => String!)
	@Column('text')
	address: string;

	@Field(() => String!)
	@Column('text', { default: moment().unix().toString() })
	createdAt: string;

	@BeforeInsert()
	async addId() {
		this.id = uuidv4();
	}
}
