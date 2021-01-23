require('dotenv').config();
require('app-module-path').addPath(__dirname);
require('source-map-support').install();

import * as Utils from './Utils';
import * as RabbitMQ from './RabbitMQ';

async function main() {
  // Make clients
  const client1 = new RabbitMQ.Client();
  await client1.init(
    process.env.SERVER_ADDRESS as string,
    process.env.USERNAME as string,
    process.env.PASSWORD as string,
    process.env.VHOST as string);
  
  const client2 = new RabbitMQ.Client();
  await client2.init(
    process.env.SERVER_ADDRESS as string,
    process.env.USERNAME as string,
    process.env.PASSWORD as string,
    process.env.VHOST as string);
  
  client1.receiveMessage('hello2', async (message) => {
    Utils.Debug.log('CLIENT1', message);
  });
  
  client2.receiveMessage('hello2', async (message) => {
    Utils.Debug.log('CLIENT2', message);
  });
  
  await client1.receiveMessageAll('hello2', async (message) => {
    Utils.Debug.log('CLIENT1', message);
  });
  
  await client2.receiveMessageAll('hello2', async (message) => {
    Utils.Debug.log('CLIENT2', message);
  });
  
  await client1.receiveMessageAll('hello3', async (message) => {
    Utils.Debug.log('CLIENT1', message);
  });
  
  await client2.receiveMessageAll('hello3', async (message) => {
    Utils.Debug.log('CLIENT2', message);
  });
 
  client1.sendMessage('hello2', 'nice to meet you');
  client1.sendMessageAll('hello2', 'nice to meet you2');
  client1.sendMessageAll('hello3', 'nice to meet you3');
  
  setTimeout(() => {
    Utils.Debug.log('Connection End');
    client1.free();
    client2.free();
    process.exit(0);
  }, 1000);
}

main();