import { Resolver, Mutation } from 'type-graphql';
import { ApiResponse } from 'neutronpay-wallet-common/dist/shared';

export const ApiConnectDebitCard = ApiResponse<String>(
	'ConnectDebitCard',
	String,
);
export type ApiConnectDebitCardType = InstanceType<
	typeof ApiConnectDebitCard
>;

@Resolver((of) => String)
class ConnectDebitCardResolver {
	@Mutation(() => ApiConnectDebitCard, { nullable: true })
	async connectDebitCard(): Promise<ApiConnectDebitCardType> {
		return {
			data: 'Debit card connect',
			success: true,
		};
	}
}

export default ConnectDebitCardResolver;
