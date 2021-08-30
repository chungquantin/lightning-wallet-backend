import { Directive, Field, ID, ObjectType } from 'type-graphql';
import {
	Entity,
	PrimaryColumn,
	BeforeInsert,
	BaseEntity,
	Column,
	JoinTable,
	ManyToMany,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { FiatCurrency } from '../constants';
import { Transaction } from './Transaction';

@Directive('@key(fields: "id")')
@ObjectType('WalletSchema')
@Entity('Wallet')
export class Wallet extends BaseEntity {
	@Field(() => ID)
	@PrimaryColumn('uuid')
	id: string;

	@Field(() => ID)
	@Column('uuid')
	userId: string;

	@Field(() => Number!)
	@Column('float', { default: 0 })
	balance: number;

	@Field(() => FiatCurrency!)
	@Column('text', { nullable: false, default: FiatCurrency.USD })
	defaultCurrency: FiatCurrency;

	@Field(() => [Transaction])
	@ManyToMany(
		() => Transaction,
		(transaction) => transaction.wallet,
		{
			onDelete: 'CASCADE',
			onUpdate: 'CASCADE',
			cascade: true,
		},
	)
	@JoinTable()
	transactions: Transaction[];

	@Field(() => String!)
	@Column('text', {
		nullable: false,
		default: new Date().toISOString(),
	})
	createdAt: string;

	@BeforeInsert()
	async addId() {
		this.id = uuidv4();
	}
}

export async function resolveWalletReference(
	reference: Pick<Wallet, 'id'>,
): Promise<Wallet | undefined> {
	return await Wallet.findOne({
		where: {
			id: reference.id,
		},
	})!;
}
