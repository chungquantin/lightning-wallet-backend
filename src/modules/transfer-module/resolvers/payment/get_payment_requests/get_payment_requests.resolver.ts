import { Resolver, Query } from 'type-graphql';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { ApiArrayResponse } from 'neutronpay-wallet-common/dist/shared';
import { Wallet } from '../../../entity';
import { TransactionRequest } from '../../../entity/TransactionRequest';
import { TransactionRequestRepository } from '../../../repository/TransactionRequestRepository';

export const ApiGetPaymentRequestsResponse =
	ApiArrayResponse<TransactionRequest>(
		'GetPaymentRequests',
		TransactionRequest,
	);
export type ApiGetPaymentRequestsResponseType = InstanceType<
	typeof ApiGetPaymentRequestsResponse
>;

@Resolver((of) => Wallet)
class GetPaymentRequestsResolver {
	@InjectRepository(TransactionRequestRepository)
	private readonly transactionRequestRepository: TransactionRequestRepository;

	@Query(() => ApiGetPaymentRequestsResponse, { nullable: true })
	async getPaymentRequests(): Promise<ApiGetPaymentRequestsResponseType> {
		const transactionRequests =
			await this.transactionRequestRepository.find({
				relations: ['transaction'],
			});

		return {
			success: true,
			data: transactionRequests,
		};
	}
}

export default GetPaymentRequestsResolver;
