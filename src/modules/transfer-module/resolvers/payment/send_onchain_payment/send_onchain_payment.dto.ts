import { Field, InputType } from "type-graphql";

@InputType()
export class SendOnchainPaymentDto {
  @Field({
    description: "Bitcoin Address",
  })
  address: string;

  @Field({
    description: "Bitcoin Amount",
  })
  amount: number;

  @Field()
  description: string;
}
