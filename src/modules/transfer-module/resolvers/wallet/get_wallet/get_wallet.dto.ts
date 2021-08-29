import { Field, InputType } from 'type-graphql';
@InputType()
export class GetWalletDto {
	@Field(() => String, { defaultValue: '' })
	walletId: string;

	@Field(() => String, { defaultValue: '' })
	userId: string;
}
