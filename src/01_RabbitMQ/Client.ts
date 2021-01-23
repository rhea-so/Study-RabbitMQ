import * as amqp from 'amqplib/callback_api';

/**
 * Message Queue Client (AMQP - amqplib)
 */
export class Client {
	private serverAddress: string;
	private username: string;
	private password: string;
	private vhost: string;
	private connection: amqp.Connection | null;
	private channel: amqp.Channel | null;

	constructor(options: { serverAddress: string, username: string, password: string, vhost: string }) {
		this.serverAddress = options.serverAddress;
		this.username = options.username;
		this.password = options.password;
		this.vhost = options.vhost;
	}

	public async init(): Promise<void> {
		await this.connect();
		await this.createChannel();
	}

	private async connect(): Promise<void> {
		return new Promise((resolve, reject) => {
			amqp.connect(`amqp://${this.username}:${this.password}@${this.serverAddress}${this.vhost}`, (error, connection) => {
				if (error) {
					reject(error);
					return;
				}
				this.connection = connection;
				resolve();
				return;
			});
		});
	}

	private async createChannel(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.connection?.createChannel((error, channel) => {
				if (error) {
					reject(error);
					return
				}
				this.channel = channel;
				resolve();
				return;
			});
		});
	}

	public createQueue(queueName: string, options?: amqp.Options.AssertQueue) {
		if (!options) {
			options = {
				durable: true // RabbitMQ가 꺼져도, Queue가 제거되지 않게 함
			}
		}
		this.channel?.assertQueue(queueName, {
			...options
		});
	}

	public createExchange(exchange: string, options?: amqp.Options.AssertExchange) {
		if (!options) {
			options = {
				durable: false
			}
		}
		this.channel?.assertExchange(exchange, 'fanout', {
			...options
		});
	}

	public setMaxReceiveCount(maxReceiveCount: number) {
		this.channel?.prefetch(maxReceiveCount); // 최대로 수용할 수 있는 메세지 수
	}

	public async enqueue(queueName: string, message: object): Promise<void> {
		const data = JSON.stringify(message);
		this.channel?.sendToQueue(queueName, Buffer.from(data), {
			persistent: true // RabbitMQ가 꺼져도, Queue에 데이터가 제거되지 않게 함
		});
	}

	public dequeue(queueName: string, func: (message: object) => Promise<void> | void): void {
		this.channel?.consume(queueName, async (message) => {
			if (message && message.content) {
				await func(JSON.parse(message.content.toString()));

				this.channel?.ack(message); // ack를 보내기 전에 서버가 죽으면, RabbitMQ가 해당 메세지를 자동으로 re-queue 한다. - https://blurblah.net/1569
			}
		});
	}

	public async publish(exchange: string, message: object): Promise<void> {
		const data = JSON.stringify(message);
		this.channel?.publish(exchange, '', Buffer.from(data));
	}

	public async subscribe(exchange: string, func: (message: object) => Promise<void> | void): Promise<void> {
		return new Promise((resolve, reject) => {
			this.channel?.assertQueue('', { exclusive: true }, (error, queue) => {
				if (error) {
					reject(error);
					return;
				}
				this.channel?.bindQueue(queue.queue, exchange, '');
				this.channel?.consume(queue.queue, async (message) => {
					if (message && message.content) {
						await func(JSON.parse(message.content.toString()));
					}
				}, { noAck: true });

				resolve();
				return;
			});
		});
	}

	public async free(): Promise<void> {
		this.connection?.close();
		this.connection = null;
		this.channel = null;
	}
}
