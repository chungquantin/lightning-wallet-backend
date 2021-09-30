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
@ObjectType('LightningPaymentSchema')
@Entity('LightningPayment')
export class LightningPayment extends BaseEntity {
	@Field(() => ID)
	@PrimaryColumn('uuid')
	id: string;

	@Field(() => String!)
	@Column('text')
	transactionId: string;

	@Field(() => String)
	@Column('text')
	paymentHash: string;

	@Field(() => String)
	@Column('text')
	paymentError: string;

	@Field(() => String)
	@Column('text')
	paymentPreImage: string;

	@Field(() => Number)
	@Column('int')
	totalFees: number;

	@Field(() => Number)
	@Column('int')
	totalAmt: Number;

	@Field(() => String!)
	@Column('text', { default: moment().unix().toString() })
	createdAt: string;

	@BeforeInsert()
	async addId() {
		this.id = uuidv4();
	}
}

export async function resolveLightningPaymentReference(
	reference: Pick<LightningPayment, 'id'>,
): Promise<LightningPayment | undefined> {
	return await LightningPayment.findOne({
		where: {
			id: reference.id,
		},
	})!;
}
