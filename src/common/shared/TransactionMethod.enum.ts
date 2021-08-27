import { registerEnumType } from 'type-graphql';

export enum TransactionMethod {
	ON_CHAIN = 'ON_CHAIN',
	LIGHTNING = 'LIGHTNING',
}

registerEnumType(TransactionMethod, {
	name: 'TransactionMethod', // this one is mandatory
	description: 'Transaction method', // this one is optional
});
