import {
	Resolver,
	UseMiddleware,
	Mutation,
	Ctx,
	ObjectType,
	Field,
} from 'type-graphql';
import {
	ApiResponse,
	CustomMessage,
} from 'neutronpay-wallet-common/dist/shared';
import { BankGQLContext } from '../../../server';
import {
	CountryCode,
	LinkTokenCreateRequest,
	LinkTokenCreateResponse,
	Products,
} from 'plaid';
import { isAuth } from 'neutronpay-wallet-common/dist/middleware';

@ObjectType()
class LinkTokenCreateResponseImpl implements LinkTokenCreateResponse {
	@Field()
	link_token: string;

	@Field()
	request_id: string;

	@Field()
	expiration: string;
}

export const ApiCreateLinkToken =
	ApiResponse<LinkTokenCreateResponseImpl>(
		'PlaidCreateLinkToken',
		LinkTokenCreateResponseImpl,
	);
export type ApiCreateLinkTokenType = InstanceType<
	typeof ApiCreateLinkToken
>;

@Resolver((of) => String)
class CreateLinkTokenResolver {
	@UseMiddleware(isAuth)
	@Mutation(() => ApiCreateLinkToken, { nullable: true })
	async createLinkToken(
		@Ctx()
		{ currentUser, dataSources: { plaidClient } }: BankGQLContext,
	): Promise<ApiCreateLinkTokenType> {
		const clientUserId = currentUser?.userId;
		if (!clientUserId) {
			return {
				success: false,
				errors: [
					{
						path: 'createLinkToken',
						message: CustomMessage.somethingWentWrong,
					},
				],
			};
		}
		const request: LinkTokenCreateRequest = {
			user: {
				client_user_id: clientUserId,
			},
			client_name: 'Plaid Test App',
			products: [Products.Transactions],
			language: 'en',
			webhook: 'https://webhook.example.com',
			country_codes: [CountryCode.Ca],
		};
		try {
			const createTokenResponse = await plaidClient.linkTokenCreate(
				request,
			);
			return {
				success: true,
				data: createTokenResponse.data,
			};
		} catch (err) {
			return {
				success: false,
				errors: [
					{
						path: 'createLinkToken',
						message: err.message,
					},
				],
			};
		}
	}
}

export default CreateLinkTokenResolver;
