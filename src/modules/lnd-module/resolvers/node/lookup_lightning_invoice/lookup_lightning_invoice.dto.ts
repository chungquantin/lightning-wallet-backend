import { Field, InputType } from "type-graphql";

@InputType()
export class LookupLightningInvoiceDto {
  @Field()
  rHash: string;
}
