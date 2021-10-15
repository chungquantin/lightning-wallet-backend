import { Directive, Field, ID, ObjectType } from "type-graphql";
import {
  Entity,
  PrimaryColumn,
  BeforeInsert,
  BaseEntity,
  Column,
  ManyToMany,
  JoinTable,
  BeforeUpdate,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import {
  FiatCurrency,
  TransactionMethod,
  TransactionStatus,
} from "../constants";
import { Wallet } from "./Wallet";
import * as moment from "moment";

@Directive('@key(fields: "id")')
@ObjectType("TransactionSchema")
@Entity("Transaction")
export class Transaction extends BaseEntity {
  @Field(() => ID)
  @PrimaryColumn("uuid")
  id: string;

  @Field(() => String!)
  @PrimaryColumn("uuid")
  fromWalletId: string;

  @Field(() => String)
  @PrimaryColumn("uuid")
  toWalletId: string;

  @Field(() => Number!)
  @Column("float", { nullable: false })
  amount: number;

  @Field(() => Number!)
  @Column("float", { nullable: false, default: 0 })
  paidAmount: number;

  @Field(() => Number!)
  @Column("float", { default: 0 })
  amountLessFee: number;

  @Field(() => Number!)
  @Column("float", { nullable: false, default: 0 })
  networkFee: number;

  @Field(() => Number!)
  @Column("float", { nullable: false, default: 0 })
  transactionFee: number;

  @Field(() => TransactionStatus!)
  @Column("text", {
    nullable: false,
    default: TransactionStatus.UNPAID,
  })
  status: TransactionStatus;

  @Field(() => String!)
  @Column("text", { nullable: false, default: "" })
  description: String;

  @Field(() => TransactionMethod!)
  @Column("text", { nullable: false })
  method: TransactionMethod;

  @Field(() => FiatCurrency!)
  @Column("text", { nullable: false, default: FiatCurrency.USD })
  currency: FiatCurrency;

  @Field(() => Number!)
  @Column("float", { nullable: false })
  btcExchangeRate: number;

  @Field(() => Number!)
  @Column("float", { nullable: false })
  btcAmount: number;

  @ManyToMany(() => Wallet, (wallet) => wallet.transactions, {
    onDelete: "CASCADE",
  })
  @JoinTable()
  wallet: Wallet[];

  @Field(() => String!)
  @Column("text", { default: moment().unix().toString() })
  createdAt: string;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  settledAt: string;

  @BeforeInsert()
  async addId() {
    this.id = uuidv4();
  }

  @BeforeUpdate()
  @BeforeInsert()
  async calculateAmountLessFee() {
    this.amountLessFee = this.amount - this.transactionFee - this.networkFee;
  }
}
