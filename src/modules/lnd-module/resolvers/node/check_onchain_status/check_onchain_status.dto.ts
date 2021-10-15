import { Field, InputType } from "type-graphql";

@InputType()
export class CheckOnChainStatusDto {
  @Field()
  userId: string;

  @Field()
  amount: number;

  @Field()
  txFee: number;

  @Field()
  createdAt: number;
}
