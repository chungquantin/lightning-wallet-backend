import { registerEnumType } from 'type-graphql';

export enum FiatCurrency {
	USD = 'USD',
	CAD = 'CAD',
	VND = 'VND',
}

registerEnumType(FiatCurrency, {
	name: 'FiatCurrency', // this one is mandatory
	description: 'Fiat currency', // this one is optional
});
