import { Directive, Field, ID, ObjectType } from 'type-graphql';
import {
	Entity,
	PrimaryColumn,
	BeforeInsert,
	BaseEntity,
	OneToOne,
	JoinColumn,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from './Transaction';

@Directive('@key(fields: "id")')
@ObjectType('TransactionRequestSchema')
@Entity('TransactionRequest')
export class TransactionRequest extends BaseEntity {
	@Field(() => ID)
	@PrimaryColumn('uuid')
	id: string;

	@Field(() => Transaction)
	@OneToOne(() => Transaction)
	@JoinColumn()
	transaction: Transaction;

	@Field(() => String!)
	@PrimaryColumn('uuid')
	requestFrom: string;

	@Field(() => String!)
	@PrimaryColumn('uuid')
	requestTo: string;

	@BeforeInsert()
	async addId() {
		this.id = uuidv4();
	}
}
