import { registerEnumType } from 'type-graphql';

export enum TransactionRequestStatus {
	UNKNOWN = 'UNKNOWN',
	PENDING = 'PENDING',
	CANCELED = 'CANCELED',
	CONFIRMED = 'CONFIRMED',
	REJECTED = 'REJECTED',
}

registerEnumType(TransactionRequestStatus, {
	name: 'TransactionRequestStatus', // this one is mandatory
	description: 'Transaction request status', // this one is optional
});
