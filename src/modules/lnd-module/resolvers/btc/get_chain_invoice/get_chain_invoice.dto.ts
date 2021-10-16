import { Field, InputType } from "type-graphql";

@InputType()
export class GetChainInvoiceDto {
  @Field()
  address: string;
}
