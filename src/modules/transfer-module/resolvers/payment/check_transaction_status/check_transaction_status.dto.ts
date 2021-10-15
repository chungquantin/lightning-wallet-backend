import { Field, InputType } from "type-graphql";

@InputType()
export class CheckTransactionStatusDto {
  @Field()
  transactionId: string;
}
