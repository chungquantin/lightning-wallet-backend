import { Resolver, Query, UseMiddleware } from 'type-graphql';
import { ApiResponse } from '../../../../../common/shared';

export const ApiHelloWorld = ApiResponse<String>(
	'HelloWorldLnd',
	String,
);
export type ApiHelloWorldType = InstanceType<typeof ApiHelloWorld>;

@Resolver((of) => String)
class HelloWorldLndResolver {
	@UseMiddleware()
	@Query(() => ApiHelloWorld, { nullable: true })
	async helloWorldLnd(): Promise<ApiHelloWorldType> {
		return {
			success: true,
			data: 'Hello World from lnd module',
		};
	}
}

export default HelloWorldLndResolver;
