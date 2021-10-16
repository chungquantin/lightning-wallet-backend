import { Field, InputType } from "type-graphql";

@InputType()
export class LookupOnChainTransactionDto {
  @Field()
  address: string;
}
