import { Directive, Field, ID, ObjectType, Root } from "type-graphql";
import {
  Entity,
  Column,
  PrimaryColumn,
  BeforeInsert,
  BaseEntity,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import * as bcrypt from "bcryptjs";
import * as moment from "moment";
import { randomIntFromInterval } from "../utils/number";

@Directive('@key(fields: "id")')
@ObjectType("UserSchema")
@Entity("User")
export class User extends BaseEntity {
  @Field(() => ID)
  @PrimaryColumn("uuid")
  id: string;

  @Field(() => String!)
  @Column("text", { unique: true, nullable: true })
  email: string;

  @Field(() => String!)
  @Column("text", { nullable: false, default: "" })
  avatar: string;

  @Field(() => Boolean!)
  @Column("bool", { default: true })
  emailVerified: boolean;

  @Field(() => Boolean!)
  @Column("bool", { default: false })
  twoFactorVerified: boolean;

  @Field(() => Boolean!)
  @Column("bool", { default: false })
  phoneNumberVerified: boolean;

  @Field(() => String!)
  @Column("text", { unique: true, nullable: true })
  phoneNumber: string;

  // @Authorized(UserRole.super_admin)
  @Column()
  password: string;

  @Field(() => String)
  @Column({
    default: `neutronpay-${randomIntFromInterval(0, 100000)}`,
    unique: true,
    length: 20,
  })
  username: string;

  @Field(() => String!)
  @Column({ nullable: true })
  firstName: string;

  @Field(() => String)
  @Column({ nullable: true })
  lastName: string;

  @Field(() => Boolean!)
  @Column("bool", { default: false })
  forgotPasswordLock: boolean;

  @Field(() => [User])
  @ManyToMany(() => User, (user) => user.contacts)
  @JoinTable()
  contacts: User[];

  @Field(() => String!)
  @Column("text", {
    default: moment().unix().toString(),
  })
  createdAt: string;

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

export async function resolveUserReference(
  reference: Pick<User, "id">
): Promise<User | undefined> {
  return await User.findOne({
    where: {
      id: reference.id,
    },
  })!;
}
