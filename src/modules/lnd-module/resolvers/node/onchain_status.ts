import { Field, ObjectType } from "type-graphql";
import { TransactionStatus } from "../../constants/TransactionStatus.enum";
import { Transaction } from "../../proto/lnd_pb";

interface IOnChainStatusResponse
  extends Pick<Transaction.AsObject, "amount" | "timeStamp" | "txHash"> {
  status: TransactionStatus;
}

@ObjectType()
export class OnChainStatusResponse implements IOnChainStatusResponse {
  @Field()
  amount: number;

  @Field()
  timeStamp: number;

  @Field()
  txHash: string;

  @Field(() => TransactionStatus!)
  status: TransactionStatus;
}
