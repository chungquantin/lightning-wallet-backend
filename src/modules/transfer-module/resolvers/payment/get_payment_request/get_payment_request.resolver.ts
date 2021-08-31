import { Resolver, Arg, Query } from 'type-graphql';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { ApiResponse } from 'neutronpay-wallet-common/dist/shared';
import { TransactionRequest } from '../../../entity/TransactionRequest';
import { TransactionRequestRepository } from '../../../repository/TransactionRequestRepository';
import { GetPaymentRequestDto } from './get_payment_request.dto';
import { CustomMessage } from '../../../constants';

export const ApiGetPaymentRequestResponse =
	ApiResponse<TransactionRequest>(
		'GetPaymentRequest',
		TransactionRequest,
	);
export type ApiGetPaymentRequestResponseType = InstanceType<
	typeof ApiGetPaymentRequestResponse
>;

@Resolver((of) => TransactionRequest)
class GetPaymentRequestResolver {
	@InjectRepository(TransactionRequestRepository)
	private readonly transactionRequestRepository: TransactionRequestRepository;

	@Query(() => ApiGetPaymentRequestResponse, { nullable: true })
	async getPaymentRequest(
		@Arg('data') { paymentRequestId }: GetPaymentRequestDto,
	): Promise<ApiGetPaymentRequestResponseType> {
		const transactionRequest =
			await this.transactionRequestRepository.findOne({
				where: {
					id: paymentRequestId,
				},
				relations: ['transaction'],
			});

		if (!transactionRequest) {
			return {
				success: false,
				errors: [
					{
						path: 'transactionRequestId',
						message: CustomMessage.transactionRequestNotFound,
					},
				],
			};
		}

		return {
			success: true,
			data: transactionRequest,
		};
	}
}

export default GetPaymentRequestResolver;
