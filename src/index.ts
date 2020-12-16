require('dotenv').config();
require('source-map-support').install();

import { Debug, LogTag } from './Utils/debugTool';

Debug.log(LogTag.NOWAY, '\n  - USERNAME: ', process.env.USERNAME, '\n  - PASSWORD:', process.env.PASSWORD);


import * as amqp from 'amqplib/callback_api';


class AMQPClient {
  private username: string;
  private password: string;
  private connection: any;
  private channel: any;
  
  public async init(username: string, password: string): Promise<void> {
    this.username = username;
    this.password = password;
    
    await this.connect();
    await this.createChannel();
  }
  
  public async sendMessage(queue: string, message: string): Promise<void> {
        this.channel.assertQueue(queue, {
            durable: false
        });
        this.channel.sendToQueue(queue, Buffer.from(message));
  }
  
  public async free(): Promise<void> {
    this.connection.close();
    this.connection = null;
    this.channel = null;
  }
  
  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      amqp.connect(`amqp://${this.username}:${this.password}@193.123.240.173`, (error, connection) => {
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
   const client = new AMQPClient();
   await client.init(process.env.USERNAME as string, process.env.PASSWORD as string);
   await client.sendMessage('hello', 'hello, world!');
    setTimeout(() => {
        Debug.log('Connection End');
        client.free();
        process.exit(0);
    }, 5000);
}

main();