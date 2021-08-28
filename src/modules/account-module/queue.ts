import { Channel } from 'amqplib';
import { Connection } from 'typeorm';
import { Queue } from '../../common/constants/queue';

interface OutgoingMessageDataMap {
	new_account_created: {
		userId: string;
	};
	new_contact_added: {
		userId: string;
		contactId: string;
	};
}

type OutgoingMessage<Key extends keyof OutgoingMessageDataMap> = {
	operation: Key;
	data: OutgoingMessageDataMap[Key];
};
interface IncomingMessageDataMap {
	hello_world: {};
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
	hello_world: () => {},
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
					console.log(`RabbitMQ:${queue}:${data.operation}`);

					handlerMap[data.operation](data.data, conn);
				}
			}
		});
	};

	channel.assertQueue(Queue.ACCOUNT_QUEUE, {
		durable: false,
		arguments: {
			'x-message-ttl': 0,
		},
	});

	mqConsume(Queue.ACCOUNT_QUEUE);
};
