require('dotenv').config();
require('source-map-support').install();

import { Debug, LogTag } from './Utils/debugTool';

Debug.log(LogTag.NOWAY, '\n  - USERNAME: ', process.env.USERNAME, '\n  - PASSWORD:', process.env.PASSWORD);


import * as amqp from 'amqplib/callback_api';


class AMQPClient {
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
        durable: true // RabbitMQ가 꺼져도, Queue가 제거되지 않고 남아있게 함
    });
    this.channel.sendToQueue(queue, Buffer.from(message), {
      persistent: true // RabbitMQ가 꺼져도, Queue에 데이터가 제거되지 않고 남아있게 함
    });
  }
  
  public receiveMessage(queue: string, func: (message: string) => Promise<void> | void, maxCount: number = 1): void {
    this.channel.assertQueue(queue, {
        durable: true // RabbitMQ가 꺼져도, Queue가 제거되지 않고 남아있게 함
    });
    this.channel.prefetch(maxCount); // 최대로 수용할 수 있는 메세지 수
    this.channel.consume(queue, async (message) => {
      await func(message?.content?.toString());
      this.channel.ack(message); // ack를 보내기 전에 서버가 죽으면, RabbitMQ가 해당 메세지를 자동으로 re-queue 한다. - https://blurblah.net/1569
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




async function main() {
  const client1 = new AMQPClient();
  await client1.init(
    process.env.SERVER_ADDRESS as string,
    process.env.USERNAME as string,
    process.env.PASSWORD as string,
    process.env.VHOST as string);
  
  const client2 = new AMQPClient();
  await client2.init(
    process.env.SERVER_ADDRESS as string,
    process.env.USERNAME as string,
    process.env.PASSWORD as string,
    process.env.VHOST as string);
  
  const client3 = new AMQPClient();
  await client3.init(
    process.env.SERVER_ADDRESS as string,
    process.env.USERNAME as string,
    process.env.PASSWORD as string,
    process.env.VHOST as string);
 
  
  client1.receiveMessage('hello', async (message) => {
    Debug.log('CLIENT1', message);
  });
  client2.receiveMessage('hello', async (message) => {
    Debug.log('CLIENT2', message);
  }, 4);
  client3.receiveMessage('hello', async (message) => {
    Debug.log('CLIENT3', message);
  });
  
  client1.sendMessage('hello', 'nice to meet you 1');
  client1.sendMessage('hello', 'nice to meet you 2');
  client1.sendMessage('hello', 'nice to meet you 3');
  client1.sendMessage('hello', 'nice to meet you 4');
  client1.sendMessage('hello', 'nice to meet you 5');
  client1.sendMessage('hello', 'nice to meet you 6');
  client1.sendMessage('hello', 'nice to meet you 7');
  client1.sendMessage('hello', 'nice to meet you 8');
  client2.sendMessage('hello', 'nice to meet you 9');
  client3.sendMessage('hello', 'nice to meet you 10');
  
  setTimeout(() => {
    Debug.log('Connection End');
    client1.free();
    client2.free();
    client3.free();
    process.exit(0);
  }, 500);
}

main();