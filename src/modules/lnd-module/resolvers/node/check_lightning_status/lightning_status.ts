import { Field, ObjectType } from "type-graphql";
import { Invoice } from "../../../proto/lnd_pb";

@ObjectType()
export class LightningStatusResponse implements Partial<Invoice.AsObject> {
  @Field()
  memo: string;

  @Field()
  rHash: string;

  @Field()
  value: number;

  @Field()
  settled: boolean;

  @Field()
  creationDate: number;

  @Field()
  settleDate: number;

  @Field()
  paymentRequest: string;

  @Field()
  cltvExpiry: number;

  @Field()
  amtPaid: number;

  @Field()
  amtPaidSat: number;

  @Field()
  amtPaidMsat: number;
}
