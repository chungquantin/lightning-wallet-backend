import { Field, InputType } from "type-graphql";
@InputType()
export class SearchUserDto {
  @Field()
  searchInput: string;
}
