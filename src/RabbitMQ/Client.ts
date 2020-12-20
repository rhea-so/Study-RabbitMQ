import { Debug, LogTag } from '../Utils/debugTool';
import * as amqp from 'amqplib/callback_api';


export class Client {
  private serverAddress: string;
  private username: string;
  private password: string;
  private vhost: string;
  private connection: any;
  private channel: any;
  
  public async init(serverAddress: string, username: string, password: string, vhost: string): Promise<void> {
    this.serverAddress = serverAddress;
    this.username = username;
    this.password = password;
    this.vhost = vhost;
    
    await this.connect();
    await this.createChannel();
  }
  
  public async sendMessage(queue: string, message: string): Promise<void> {
    this.channel.assertQueue(queue, {
        // RabbitMQ가 꺼져도, Queue가 제거되지 않게 함
		durable: true
	});
    this.channel.sendToQueue(queue, Buffer.from(message), {
		// RabbitMQ가 꺼져도, Queue에 데이터가 제거되지 않게 함
		presistent: true
	});
  }
  
  public receiveMessage(queue: string, func: (message: string) => Promise<void> | void, maxCount: number = 1): void {
    this.channel.assertQueue(queue, {
        // RabbitMQ가 꺼져도, Queue가 제거되지 않게 함
		durable: true
	});
    this.channel.prefetch(maxCount); // 최대로 수용할 수 있는 메세지 수
    this.channel.consume(queue, async (message) => {
      await func(message?.content?.toString());

	  // ack를 보내기 전에 서버가 죽으면, RabbitMQ가 해당 메세지를 자동으로 re-queue 한다. - https://blurblah.net/1569
      this.channel.ack(message);
	});
  }
  
  public async free(): Promise<void> {
    this.connection.close();
    this.connection = null;
    this.channel = null;
  }
  
  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      amqp.connect(`amqp://${this.username}:${this.password}@${this.serverAddress}${this.vhost}`, (error, connection) => {
        if (error) {
          Debug.log(LogTag.ERROR, 'CAN_NOT_CONNECT_TO_SERVER', error);
          reject(error);
        }
        this.connection = connection;
        resolve();        
      });
    });
  }
  
  private async createChannel(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.connection.createChannel((error, channel) => {
        if (error) {
          Debug.log(LogTag.ERROR, 'CAN_NOT_CREATE_CONNECTION', error);
          reject(error);
        }
        this.channel = channel;
        resolve();
      });
    });
  }
}
