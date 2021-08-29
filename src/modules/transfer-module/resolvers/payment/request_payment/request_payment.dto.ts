import { Field, InputType } from 'type-graphql';
import { FiatCurrency } from '../../../../../common/shared';
import { TransactionMethod } from '../../../../../common/shared/TransactionMethod.enum';
@InputType()
export class RequestPaymentDto {
	@Field()
	walletId: string;

	@Field()
	amount: number;

	@Field()
	currency: FiatCurrency;

	@Field()
	method: TransactionMethod;

	@Field()
	description: string;
}
