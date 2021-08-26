import { Resolver, Query, UseMiddleware } from 'type-graphql';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { WalletRepository } from '../../../repository/wallet/WalletRepository';
import { ApiResponse } from '../../../../../common/shared';

export const ApiHelloWorldResponse = ApiResponse<String>(
	'HelloWorld',
	String,
);
export type ApiHelloWorldResponseType = InstanceType<
	typeof ApiHelloWorldResponse
>;

@Resolver((of) => String)
class HelloWorldResolver {
	@InjectRepository(WalletRepository)
	private readonly WalletRepository: WalletRepository;

	@UseMiddleware()
	@Query(() => ApiHelloWorldResponse, { nullable: true })
	async helloWorld(): Promise<ApiHelloWorldResponseType> {
		return {
			success: true,
			data: 'Hello World',
		};
	}
}

export default HelloWorldResolver;
