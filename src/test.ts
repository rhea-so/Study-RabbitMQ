require('app-module-path').addPath(__dirname);
require('source-map-support').install();
require('dotenv').config();

import { Debug, delay } from './00_Utils';
import * as RabbitMQ from './01_RabbitMQ';

async function main() {
	const options = {
		serverAddress: process.env.SERVER_ADDRESS as string,
		username: process.env.USERNAME as string,
		password: process.env.PASSWORD as string,
		vhost: process.env.VHOST as string
	}

	const client1 = new RabbitMQ.Client(options);
	await client1.init();

	const client2 = new RabbitMQ.Client(options);
	await client2.init();

	setTimeout(() => {
		Debug.log('Connection Destroyed');
		client1.free();
		client2.free();
		process.exit(0);
	}, 5000);

	client1.createQueue('TEST_QUEUE_1');
	client1.createQueue('TEST_QUEUE_2');
	client1.createExchange('TEST_EXCHANGE_1');
	client1.createExchange('TEST_EXCHANGE_2');
	client1.setMaxReceiveCount(10);

	const callbacks: Function[] = [];

	client1.dequeue('TEST_QUEUE_1', async (message) => {
		Debug.log('TEST_QUEUE_1, CLIENT1', message);
		await delay(100);
		await client1.enqueue('TEST_QUEUE_2', { time: (new Date()).toString(), value: message.value });
	});

	client2.dequeue('TEST_QUEUE_2', async (message) => {
		Debug.log('TEST_QUEUE_2, CLIENT2', message);
		for (const callback of callbacks) {
			callback(message);
		}
	});

	await client2.enqueue('TEST_QUEUE_1', { time: (new Date()).toString(), value: 1 });
	await client2.enqueue('TEST_QUEUE_1', { time: (new Date()).toString(), value: 2 });
}

main();