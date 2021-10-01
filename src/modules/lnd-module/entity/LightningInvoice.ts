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
@ObjectType('LightningInvoiceSchema')
@Entity('LightningInvoice')
export class LightningInvoice extends BaseEntity {
	@Field(() => ID)
	@PrimaryColumn('uuid')
	id: string;

	@Field(() => String!)
	@Column('text')
	userId: string;

	@Field(() => Number!)
	@Column('int')
	addIndex: number;

	@Field(() => String!)
	@Column('text')
	payReq: string;

	@Field(() => String!)
	@Column('text')
	rHash: string;

	@Field(() => String)
	@Column('text', { default: moment().unix().toString() })
	createdAt: string;

	@Field(() => String)
	@Column('text', {
		default: moment().add(1, 'minute').unix().toString(),
	})
	expiresAt: string;

	@BeforeInsert()
	async addId() {
		this.id = uuidv4();
	}
}
