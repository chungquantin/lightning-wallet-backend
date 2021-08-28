import { Resolver, UseMiddleware, Mutation, Arg } from 'type-graphql';
import { ApiResponse } from '../../../../../common/shared';
import { SendPayment } from '../../../node';
import { LndSendPaymentDto } from './send_payment.dto';

export const ApiSendPayment = ApiResponse<String>(
	'LndSendPayment',
	String,
);
export type ApiSendPaymentType = InstanceType<typeof ApiSendPayment>;

@Resolver((of) => String)
class LndSendPaymentResolver {
	@UseMiddleware()
	@Mutation(() => ApiSendPayment, { nullable: true })
	async lndSendPayment(
		@Arg('data') { paymentRequest }: LndSendPaymentDto,
	): Promise<ApiSendPaymentType> {
		try {
			const response = await SendPayment({
				payment_request: paymentRequest,
			});
			return {
				success: true,
				data: response?.payment_hash.toString() || '',
			};
		} catch (err) {
			return {
				success: false,
				errors: [
					{
						message: err.message,
						path: 'lndSendPayment',
					},
				],
			};
		}
	}
}

export default LndSendPaymentResolver;
