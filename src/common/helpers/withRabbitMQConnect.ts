import * as amqp from 'amqplib';

export default async function withRabbitMQConnect(
	name,
	url,
	callback,
) {
	try {
		const connection = await amqp.connect(
			url || 'amqp://localhost:5432',
		);
		const channel = await connection.createChannel();

		console.log(`--- [SERVICE: ${name}] Message queue ready`);
		return callback({ channel });
	} catch (err) {
		console.log(`--- [SERVICE: ${name}] ERROR!!!`);
		console.error(err);
	}
}
