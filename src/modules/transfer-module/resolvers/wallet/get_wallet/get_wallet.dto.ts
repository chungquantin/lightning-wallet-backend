import { Field, InputType } from "type-graphql";
@InputType()
export class GetWalletDto {
	@Field()
	userId: string;
}
