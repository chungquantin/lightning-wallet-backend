import { Channel } from 'amqplib';
import { Connection } from 'typeorm';
import { CustomMessage } from '../../common/shared';
import { Wallet } from './entity';

export enum Queue {
	ACCOUNT_TRANSFER_QUEUE = 'ACCOUNT_TRANSFER_QUEUE',
}

interface OutgoingMessageDataMap {}

type OutgoingMessage<Key extends keyof OutgoingMessageDataMap> = {
	operation: Key;
	data: OutgoingMessageDataMap[Key];
};
interface IncomingMessageDataMap {
	new_account_created: {
		userId: string;
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
	new_account_created: async ({ userId }, conn: Connection) => {
		const walletRepository = await conn.getRepository(Wallet);
		if (
			!!(await walletRepository.findOne({
				where: {
					userId,
				},
			}))
		) {
			throw new Error(CustomMessage.walletIsCreatedAlready);
		}
		await walletRepository
			.create({
				userId,
			})
			.save();
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

	channel.assertQueue(Queue.ACCOUNT_TRANSFER_QUEUE, {
		durable: false,
		arguments: {
			'x-message-ttl': 0,
		},
	});

	mqConsume<'new_account_created'>(Queue.ACCOUNT_TRANSFER_QUEUE);
};
