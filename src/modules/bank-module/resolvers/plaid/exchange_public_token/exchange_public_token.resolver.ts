import { Resolver, Ctx, Query, Arg } from 'type-graphql';
import { ApiResponse } from 'neutronpay-wallet-common/dist/shared';
import { BankGQLContext } from '../../../server';
import { ExchangeTokenDto } from './exchange_public_token.dto';

export const ApiExchangePublicToken = ApiResponse<String>(
	'PlaidExchangePublicToken',
	String,
);
export type ApiExchangePublicTokenType = InstanceType<
	typeof ApiExchangePublicToken
>;

@Resolver((of) => String)
class ExchangePublicTokenResolver {
	@Query(() => ApiExchangePublicToken, { nullable: true })
	async exchangePublicToken(
		@Ctx() { dataSources: { plaidClient } }: BankGQLContext,
		@Arg('data') { publicToken }: ExchangeTokenDto,
	): Promise<ApiExchangePublicTokenType> {
		try {
			const {
				data: { access_token },
			} = await plaidClient.itemPublicTokenExchange({
				public_token: publicToken,
			});

			const authResponse = await plaidClient.authGet({
				access_token,
			});
			console.log('-----------------');
			console.log('Auth response: ');
			console.log(authResponse.data);

			const identityResponse = await plaidClient.identityGet({
				access_token,
			});
			console.log('-----------------');
			console.log('Identity response: ');
			console.log(identityResponse.data);

			const balanceResponse = await plaidClient.accountsBalanceGet({
				access_token,
			});
			console.log('-----------------');
			console.log('Balance response: ');
			console.log(balanceResponse.data);

			return {
				success: true,
				data: 'exchangePublicToken is executed successfully',
			};
		} catch (err) {
			return {
				success: false,
				errors: [
					{
						path: 'exchangePublicToken',
						message: err.message,
					},
				],
			};
		}
	}
}

export default ExchangePublicTokenResolver;
