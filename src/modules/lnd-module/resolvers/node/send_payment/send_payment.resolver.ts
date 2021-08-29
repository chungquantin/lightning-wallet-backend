import {
	Resolver,
	UseMiddleware,
	Mutation,
	Arg,
	Ctx,
} from 'type-graphql';
import { Queue } from '../../../../../common/constants/queue';
import {
	ApiResponse,
	CustomMessage,
} from '../../../../../common/shared';
import { GQLContext } from '../../../../../common/utils/graphql-utils';
import { SendPayment } from '../../../node';
import { mqProduce } from '../../../queue';
import { LndSendPaymentDto } from './send_payment.dto';

export const ApiSendPayment = ApiResponse<String>(
	'LndSendPayment',
	String,
);
export type ApiSendPaymentType = InstanceType<typeof ApiSendPayment>;

@Resolver((of) => String)
class LightningSendPaymentResolver {
	@UseMiddleware()
	@Mutation(() => ApiSendPayment, { nullable: true })
	async lightningSendPayment(
		@Arg('data') { paymentRequest }: LndSendPaymentDto,
		@Ctx() { channel }: GQLContext,
	): Promise<ApiSendPaymentType> {
		try {
			const response = await SendPayment({
				payment_request: paymentRequest,
			});

			if (!response) {
				return {
					success: false,
					errors: [
						{
							message: CustomMessage.somethingWentWrong,
							path: 'lightningSendPayment',
						},
					],
				};
			}
			mqProduce<'lightning_payment_sended'>(
				channel,
				Queue.NOTIFICATION_QUEUE,
				{
					data: response,
					operation: 'lightning_payment_sended',
				},
			);

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
						path: 'lightningSendPayment',
					},
				],
			};
		}
	}
}

export default LightningSendPaymentResolver;
