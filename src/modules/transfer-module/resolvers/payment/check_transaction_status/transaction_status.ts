import { Field, ObjectType } from "type-graphql";
import { TransactionMethod, TransactionStatus } from "../../../constants";

@ObjectType()
export class CheckTransactionStatusResponse {
  @Field()
  transactionId: string;

  @Field(() => TransactionStatus)
  status: TransactionStatus;

  @Field()
  paidAmount: number;

  @Field()
  method: TransactionMethod;
}
