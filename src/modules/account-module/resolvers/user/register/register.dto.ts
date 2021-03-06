import { Field, InputType } from "type-graphql";

@InputType()
export class RegisterDto {
  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  email: string;

  @Field()
  password: string;

  @Field()
  phoneNumber: string;

  @Field()
  avatar: string;

  @Field()
  username?: string;
}
