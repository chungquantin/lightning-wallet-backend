import {
	Resolver,
	UseMiddleware,
	Mutation,
	Arg,
	Ctx,
} from 'type-graphql';
import { Queue } from 'neutronpay-wallet-common/dist/constants/queue';
import {
	ApiResponse,
	CustomMessage,
} from 'neutronpay-wallet-common/dist/shared';
import { GQLContext } from 'neutronpay-wallet-common/dist/utils/graphql-utils';
import { SendPayment } from '../../../node';
import { mqProduce } from '../../../queue';
import { SendLightningPaymentDto } from './send_lightning_payment.dto';

export const ApiSendLightningPayment = ApiResponse<String>(
	'SendLightningPayment',
	String,
);
export type ApiSendLightningPaymentType = InstanceType<
	typeof ApiSendLightningPayment
>;

@Resolver((of) => String)
class SendLightningPaymentResolver {
	@UseMiddleware()
	@Mutation(() => ApiSendLightningPayment, { nullable: true })
	async sendLightningPayment(
		@Arg('data') { paymentRequest }: SendLightningPaymentDto,
		@Ctx() { channel }: GQLContext,
	): Promise<ApiSendLightningPaymentType> {
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
							path: 'sendLightningPayment',
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
						path: 'sendLightningPayment',
					},
				],
			};
		}
	}
}

export default SendLightningPaymentResolver;
