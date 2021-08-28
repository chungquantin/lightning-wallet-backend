import { registerEnumType } from 'type-graphql';

export enum TransactionStatus {
	UNKNOWN = 'UNKNOWN',
	PENDING = 'PENDING',
	DONE = 'DONE',
	EXPIRED = 'EXPIRED',
}

registerEnumType(TransactionStatus, {
	name: 'TransactionStatus', // this one is mandatory
	description: 'Transaction status', // this one is optional
});
