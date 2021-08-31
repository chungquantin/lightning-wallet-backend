import { Directive, Field, ID, ObjectType } from 'type-graphql';
import {
	Entity,
	PrimaryColumn,
	BeforeInsert,
	BaseEntity,
	OneToOne,
	JoinColumn,
	Column,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { TransactionMethod } from '../constants';
import { Transaction } from './Transaction';
import * as moment from 'moment';
import { TransactionRequestStatus } from '../constants/TransactionRequestStatus.enum';

@Directive('@key(fields: "id")')
@ObjectType('TransactionRequestSchema')
@Entity('TransactionRequest')
export class TransactionRequest extends BaseEntity {
	@Field(() => ID)
	@PrimaryColumn('uuid')
	id: string;

	@Field(() => Transaction)
	@OneToOne(() => Transaction, {
		onUpdate: 'CASCADE',
	})
	@JoinColumn()
	transaction: Transaction;

	@Field(() => TransactionRequestStatus!)
	@Column('text', {
		nullable: false,
		default: TransactionRequestStatus.UNKNOWN,
	})
	status: TransactionRequestStatus;

	@Field(() => String!)
	@Column('uuid')
	requestFrom: string;

	@Field(() => String!)
	@Column('uuid')
	requestTo: string;

	@Field(() => String!)
	@Column('text', { default: moment().unix().toString() })
	createdAt: string;

	@Field(() => String!)
	@Column('text')
	expiredAt: string;

	@BeforeInsert()
	async addId() {
		this.id = uuidv4();
	}

	@BeforeInsert()
	async addExpiredAt() {
		switch (this.transaction.method) {
			case TransactionMethod.LIGHTNING:
				this.expiredAt = moment().add(5, 'hours').unix().toString();
				break;
			case TransactionMethod.ON_CHAIN:
				this.expiredAt = moment().add(12, 'hours').unix().toString();
				break;
			default:
				break;
		}
	}
}
