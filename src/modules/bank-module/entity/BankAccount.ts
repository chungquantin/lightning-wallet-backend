import { Directive, Field, ID, ObjectType } from 'type-graphql';
import {
	Entity,
	PrimaryColumn,
	BeforeInsert,
	BaseEntity,
	Column,
	JoinColumn,
	OneToOne,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as moment from 'moment';
import { BankAccountBalance } from './BankAccountBalance';
import { BankAccountType } from '../constants/BankAccountType';
import { BankAccountAch } from './BankAccountAch';

@Directive('@key(fields: "id")')
@ObjectType('BankAccountSchema')
@Entity('BankAccount')
export class BankAccount extends BaseEntity {
	@Field(() => ID)
	@PrimaryColumn('uuid')
	id: string;

	@Field(() => String!)
	@Column('text')
	userId: string;

	@Field(() => String!)
	@Column('text')
	accountId: string;

	@Field(() => String!)
	@Column('text')
	institutionId: string;

	@Field(() => String!)
	@Column('text')
	institutionName: string;

	@Field(() => BankAccountBalance!)
	@OneToOne(() => BankAccountBalance, { cascade: true })
	@JoinColumn()
	balance: BankAccountBalance;

	@Field(() => BankAccountAch!)
	@OneToOne(() => BankAccountAch, { cascade: true, nullable: true })
	@JoinColumn()
	ach: BankAccountAch;

	@Field(() => String!)
	@Column('text')
	name: string;

	@Field(() => String!, { nullable: true })
	@Column('text')
	officialName: string;

	@Field(() => String, { nullable: true })
	@Column('text')
	subType: string;

	@Field(() => BankAccountType!)
	@Column('text')
	type: BankAccountType;

	@Field(() => String!)
	@Column('text', { default: moment().unix().toString() })
	addedAt: string;

	@BeforeInsert()
	async addId() {
		this.id = uuidv4();
	}
}
