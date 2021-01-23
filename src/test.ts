require('app-module-path').addPath(__dirname);
require('source-map-support').install();
require('dotenv').config();

import { Debug } from './00_Utils';
import * as RabbitMQ from './01_RabbitMQ';

async function main() {
	let sendCountPerSec = 0;
	let receiveCountPerSec = 0;
	let sendCountPerSecTotal = 0;
	let receiveCountPerSecTotal = 0;

	const options = {
		serverAddress: process.env.SERVER_ADDRESS as string,
		username: process.env.USERNAME as string,
		password: process.env.PASSWORD as string,
		vhost: process.env.VHOST as string
	}

	const client1 = new RabbitMQ.Client(options);
	await client1.init();

	client1.createQueue('TEST_QUEUE_1');
	client1.createQueue('TEST_QUEUE_2');
	client1.createExchange('TEST_EXCHANGE_1');
	client1.createExchange('TEST_EXCHANGE_2');
	client1.setMaxReceiveCount(10);

	const client2 = new RabbitMQ.Client(options);
	await client2.init();

	client1.dequeue('TEST_QUEUE_1', async (message) => {
		// Debug.log('TEST_QUEUE_1, CLIENT1', message);
		// await delay(100);
		receiveCountPerSec++;
	});

	client2.dequeue('TEST_QUEUE_1', async (message) => {
		// Debug.log('TEST_QUEUE_1, CLIENT2', message);
		// await delay(100);
		receiveCountPerSec++;
	});

	client1.dequeue('TEST_QUEUE_2', async (message) => {
		// Debug.log('TEST_QUEUE_2, CLIENT1', message);
		receiveCountPerSec++;
	});

	client2.dequeue('TEST_QUEUE_2', async (message) => {
		// Debug.log('TEST_QUEUE_2, CLIENT2', message);
		receiveCountPerSec++;
	});

	await client1.subscribe('TEST_EXCHANGE_1', async (message) => {
		// Debug.log('TEST_EXCHANGE_1, CLIENT1', message);
		// await delay(100);
		receiveCountPerSec++;
	});

	await client2.subscribe('TEST_EXCHANGE_1', async (message) => {
		// Debug.log('TEST_EXCHANGE_1, CLIENT2', message);
		// await delay(100);
		receiveCountPerSec++;
	});

	await client1.subscribe('TEST_EXCHANGE_2', async (message) => {
		// Debug.log('TEST_EXCHANGE_2, CLIENT1', message);
		receiveCountPerSec++;
	});

	await client2.subscribe('TEST_EXCHANGE_2', async (message) => {
		// Debug.log('TEST_EXCHANGE_2, CLIENT2', message);
		receiveCountPerSec++;
	});

	let stop = false;
	setInterval(async () => {
		if (!stop) {
			await client1.enqueue('TEST_QUEUE_1', { message: 'nice to meet you' });
			sendCountPerSec++;
			await client1.enqueue('TEST_QUEUE_2', { message: 'nice to meet you' });
			sendCountPerSec++;
			await client1.publish('TEST_EXCHANGE_1', { message: 'nice to meet you2' });
			sendCountPerSec += 2;
			await client1.publish('TEST_EXCHANGE_2', { message: 'nice to meet you3' });
			sendCountPerSec += 2;
		}
	}, 10);

	setInterval(() => {
		sendCountPerSecTotal += sendCountPerSec;
		receiveCountPerSecTotal += receiveCountPerSec;
		Debug.log('sendCountPerSec:', sendCountPerSec, '/', sendCountPerSecTotal);
		Debug.log('receiveCountPerSec:', receiveCountPerSec, '/', receiveCountPerSecTotal);
		sendCountPerSec = 0;
		receiveCountPerSec = 0;
	}, 1000)

	setTimeout(() => {
		stop = true;
		setTimeout(() => {
			Debug.log('Connection Destroyed');
			client1.free();
			client2.free();
			process.exit(0);
		}, 5000);
	}, 60000);
}

main();