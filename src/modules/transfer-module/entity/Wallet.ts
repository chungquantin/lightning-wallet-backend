import { Directive, Field, ID, ObjectType } from 'type-graphql';
import {
	Entity,
	PrimaryColumn,
	BeforeInsert,
	BaseEntity,
	Column,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { FiatCurrency } from '../../../common/shared';

@Directive('@extends')
@Directive('@key(fields: "id")')
@ObjectType('UserSchema')
@Entity('Wallet')
export class Wallet extends BaseEntity {
	@Directive('@external')
	@Field(() => ID)
	@PrimaryColumn('uuid')
	id: string;

	@Field(() => Number!)
	@Column('int', { default: 0 })
	balance: number;

	@Field(() => FiatCurrency!)
	@Column('text', { nullable: false, default: FiatCurrency.USD })
	defaultCurrency: FiatCurrency;

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
