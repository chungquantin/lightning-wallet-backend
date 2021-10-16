import { Field, ObjectType } from "type-graphql";
import { Transaction } from "../../proto/lnd_pb";

@ObjectType()
export class OnchainTransaction implements Transaction.AsObject {
  @Field()
  txHash: string;
  @Field()
  amount: number;
  @Field()
  numConfirmations: number;
  @Field()
  blockHash: string;
  @Field()
  blockHeight: number;
  @Field()
  timeStamp: number;
  @Field()
  totalFees: number;
  @Field(() => [String])
  destAddresses: string[];
  @Field()
  rawTxHex: string;
  @Field()
  label: string;
}
