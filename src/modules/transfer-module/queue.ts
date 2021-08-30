import { Channel } from 'amqplib';
import { Connection } from 'typeorm';
import { Queue } from 'neutronpay-wallet-common/dist/constants/queue';
import { CustomMessage } from 'neutronpay-wallet-common/dist/shared';
import { Wallet } from './entity';
import { Transaction } from './entity/Transaction';
import { TransactionRequest } from './entity/TransactionRequest';
interface OutgoingMessageDataMap {
	transaction_sended: {
		transaction: Transaction;
	};
	transaction_requested: {
		transactionRequest: TransactionRequest;
	};
}

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
				balance: 100000,
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

	channel.assertQueue(Queue.TRANSFER_QUEUE, {
		durable: false,
		arguments: {
			'x-message-ttl': 0,
		},
	});

	mqConsume<'new_account_created'>(Queue.TRANSFER_QUEUE);
};
