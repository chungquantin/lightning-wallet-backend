import { Field, InputType } from "type-graphql";

@InputType()
export class GetLightningInvoiceDto {
  @Field()
  paymentRequest: string;
}
