import { Configuration, PlaidEnvironments } from 'plaid';

const mockSecret = {
	PLAID_ENV: 'sandbox',
	PLAID_CLIENT_ID: '5c6c5adc09ec71001165f35a',
	PLAID_SECRET: 'f36fcfa08b03e8ed7048053dd40086',
};

export const plaidConfiguration = new Configuration({
	basePath: PlaidEnvironments[mockSecret.PLAID_ENV as string],
	baseOptions: {
		headers: {
			'PLAID-CLIENT-ID': mockSecret.PLAID_CLIENT_ID,
			'PLAID-SECRET': mockSecret.PLAID_SECRET,
		},
	},
});
