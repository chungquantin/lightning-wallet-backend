import { registerEnumType } from 'type-graphql';

export enum BankAccountType {
	Investment = 'investment',
	Credit = 'credit',
	Depository = 'depository',
	Loan = 'loan',
	Brokerage = 'brokerage',
	Other = 'other',
}

registerEnumType(BankAccountType, {
	name: 'BankAccountType', // this one is mandatory
	description: 'Values of the Bank Account Type field', // this one is optional
});
