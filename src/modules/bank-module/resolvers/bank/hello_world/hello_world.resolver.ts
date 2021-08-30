import { Resolver, Query, UseMiddleware } from 'type-graphql';
import { ApiResponse } from 'neutronpay-wallet-common/dist/shared';

export const ApiHelloWorld = ApiResponse<String>(
	'HelloWorld',
	String,
);
export type ApiHelloWorldType = InstanceType<typeof ApiHelloWorld>;

@Resolver((of) => String)
class HelloWorldResolver {
	@UseMiddleware()
	@Query(() => ApiHelloWorld, { nullable: true })
	async helloWorld(): Promise<ApiHelloWorldType> {
		return {
			success: true,
			data: 'Hello World from bank module',
		};
	}
}

export default HelloWorldResolver;
