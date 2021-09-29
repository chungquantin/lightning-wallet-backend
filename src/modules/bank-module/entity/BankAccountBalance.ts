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
@ObjectType('BankAccountBalanceSchema')
@Entity('BankAccountBalance')
export class BankAccountBalance extends BaseEntity {
	@Field(() => ID)
	@PrimaryColumn('uuid')
	id: string;

	@Field(() => Number!, { nullable: true })
	@Column('float')
	availableBalance: number | undefined;

	@Field(() => Number!, { nullable: true })
	@Column('float')
	currentBalance: number | undefined;

	@Field(() => Number)
	@Column('float', { nullable: true })
	limitBalance: number | null | undefined;

	@Field(() => String)
	@Column('text', { nullable: true })
	isoCurrencyCode: string | null | undefined;

	@Field(() => String)
	@Column('text', { nullable: true })
	unofficialCurrencyCode: string | undefined;

	@BeforeInsert()
	async addId() {
		this.id = uuidv4();
	}
}
