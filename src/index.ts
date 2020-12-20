require('dotenv').config();
require('source-map-support').install();

import { Debug, LogTag } from './Utils/debugTool';

Debug.log(LogTag.NOWAY, '\n  - USERNAME: ', process.env.USERNAME, '\n  - PASSWORD:', process.env.PASSWORD);

import { AMQPClient } from './RabbitMQ/Client';



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
