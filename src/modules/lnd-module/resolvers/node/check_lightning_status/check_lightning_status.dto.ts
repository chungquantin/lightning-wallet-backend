import { Field, InputType } from "type-graphql";

@InputType()
export class CheckLightningStatusDto {
  @Field()
  userId: string;
}
