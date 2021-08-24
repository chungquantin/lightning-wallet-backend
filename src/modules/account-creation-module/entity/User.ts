import { Directive, Field, ID, ObjectType, Root } from 'type-graphql';
import {
	Entity,
	Column,
	PrimaryColumn,
	BeforeInsert,
	BaseEntity,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { FiatCurrency } from '../../../shared/FiatCurrency.enum';

@ObjectType('UserSchema')
@Directive('@key(fields: "id")')
@Entity('User')
export class User extends BaseEntity {
	@Field(() => ID)
	@PrimaryColumn('uuid')
	id: string;

	@Field(() => String!)
	@Directive('@cacheControl(maxAge: 30)')
	@Column('text', { unique: true })
	email: string;

	@Field(() => String!)
	@Directive('@cacheControl(maxAge: 20)')
	@Column('text', { nullable: false })
	avatar: string;

	@Field(() => Boolean!)
	@Column('bool', { default: false })
	emailVerified: boolean;

	@Field(() => Boolean!)
	@Column('bool', { default: false })
	twoFactorVerified: boolean;

	@Field(() => Number!)
	@Column('int', { default: 0 })
	balance: number;

	@Field(() => Boolean!)
	@Column('bool', { default: false })
	phoneNumberVerified: boolean;

	@Field(() => String!)
	@Directive('@cacheControl(maxAge: 30)')
	@Column('text', { unique: true })
	phoneNumber: string;

	// @Authorized(UserRole.super_admin)
	@Field(() => String!)
	@Column()
	password: string;

	@Field(() => String!)
	@Column({ nullable: true })
	firstName: string;

	@Field(() => String!)
	@Column({ nullable: true })
	lastName: string;

	@Field(() => FiatCurrency!)
	@Column('text', { nullable: false, default: FiatCurrency.USD })
	defaultCurrency: FiatCurrency;

	@Field(() => Boolean!)
	@Column('bool', { default: false })
	forgotPasswordLock: boolean;

	// External
	@Field(() => String!)
	name(@Root() parent: User): string {
		return `${parent.firstName} ${parent.lastName}`;
	}

	@BeforeInsert()
	async addId() {
		this.id = uuidv4();
	}

	@BeforeInsert()
	async hashPassword() {
		this.password = await bcrypt.hash(this.password, 10);
	}
}
