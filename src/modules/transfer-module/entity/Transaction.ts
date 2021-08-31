import { Directive, Field, ID, ObjectType } from 'type-graphql';
import {
	Entity,
	PrimaryColumn,
	BeforeInsert,
	BaseEntity,
	Column,
	ManyToMany,
	JoinTable,
	CreateDateColumn,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
	FiatCurrency,
	TransactionMethod,
	TransactionStatus,
} from '../constants';
import { Wallet } from './Wallet';

@Directive('@key(fields: "id")')
@ObjectType('TransactionSchema')
@Entity('Transaction')
export class Transaction extends BaseEntity {
	@Field(() => ID)
	@PrimaryColumn('uuid')
	id: string;

	@Field(() => String!)
	@PrimaryColumn('uuid')
	fromWalletId: string;

	@Field(() => String!)
	@PrimaryColumn('uuid')
	toWalletId: string;

	@Field(() => Number!)
	@Column('float', { nullable: false })
	amount: number;

	@Field(() => Number!)
	@Column('float', { nullable: false, default: 0 })
	networkFee: number;

	@Field(() => Number!)
	@Column('float', { nullable: false, default: 0 })
	transactionFee: number;

	@Field(() => TransactionStatus!)
	@Column('text', {
		nullable: false,
		default: TransactionStatus.UNKNOWN,
	})
	status: TransactionStatus;

	@Field(() => String!)
	@Column('text', { nullable: false, default: '' })
	description: String;

	@Field(() => TransactionMethod!)
	@Column('text', { nullable: false })
	method: TransactionMethod;

	@Field(() => FiatCurrency!)
	@Column('text', { nullable: false, default: FiatCurrency.USD })
	currency: FiatCurrency;

	@Field(() => Number!)
	@Column('float', { nullable: false })
	btcExchangeRate: number;

	@Field(() => Number!)
	@Column('float', { nullable: false })
	btcAmount: number;

	@ManyToMany(() => Wallet, (wallet) => wallet.transactions, {
		onDelete: 'CASCADE',
	})
	@JoinTable()
	wallet: Wallet[];

	@Field(() => String!)
	@CreateDateColumn({ type: 'timestamp' })
	createdAt: string;

	@BeforeInsert()
	async addId() {
		this.id = uuidv4();
	}
}
