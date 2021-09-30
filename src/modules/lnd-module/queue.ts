import { Channel } from 'amqplib';
import { Connection } from 'typeorm';
import { Queue } from 'neutronpay-wallet-common/dist/constants/queue';
import { CustomMessage } from 'neutronpay-wallet-common/dist/shared';
import { SendPayment } from './node';
import { LightningPayment } from './entity/LightningPayment';

interface OutgoingMessageDataMap {}

type OutgoingMessage<Key extends keyof OutgoingMessageDataMap> = {
	operation: Key;
	data: OutgoingMessageDataMap[Key];
};
interface IncomingMessageDataMap {
	lightning_payment_sended: {
		paymentRequest: PaymentRequest;
	};
}
interface IncomingMessage<Key extends keyof IncomingMessageDataMap> {
	operation: Key;
	data: IncomingMessageDataMap[Key];
}

type HandlerMap = {
	[Key in keyof IncomingMessageDataMap]: (
		d: IncomingMessageDataMap[Key],
		conn: Connection,
	) => void;
};

const handlerMap: HandlerMap = {
	// Produced from Wallet Module -> sendLightningPayment
	lightning_payment_sended: async ({ paymentRequest }) => {
		const response = await SendPayment({
			payment_request: paymentRequest,
		});

		if (!response) {
			throw {
				success: false,
				errors: [
					{
						message: CustomMessage.somethingWentWrong,
						path: 'sendLightningPayment',
					},
				],
			};
		}
		LightningPayment.create({
			paymentError: response.payment_error,
			paymentPreImage: response.payment_preimage.toString(),
			paymentHash: response.payment_hash.toString(),
			totalFees: response.payment_route?.totalFees,
			totalAmt: response.payment_route?.totalAmt,
		}).save();
	},
};

export const mqProduce = <Key extends keyof OutgoingMessageDataMap>(
	channel,
	queue: Queue,
	obj: OutgoingMessage<Key>,
) => {
	channel.sendToQueue(queue, Buffer.from(JSON.stringify(obj)));
};

export const queueHandler = async (
	conn: Connection,
	channel: Channel,
) => {
	const mqConsume = <Key extends keyof IncomingMessageDataMap>(
		queue: Queue,
	) => {
		channel.consume(queue, async (e) => {
			let data: IncomingMessage<Key> | undefined;
			const m = e?.content.toString();
			if (m) {
				data = JSON.parse(m);
				if (data) {
					handlerMap[data.operation](data.data, conn);
				}
			}
		});
	};

	mqConsume(Queue.LND_QUEUE);

	channel.assertQueue(Queue.LND_QUEUE, {
		durable: false,
		arguments: {
			'x-message-ttl': 0,
		},
	});
};
