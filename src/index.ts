require('dotenv').config();
require('app-module-path').addPath(__dirname);
require('source-map-support').install();

import * as Utils from 'Utils';
import * as RabbitMQ from 'RabbitMQ';
import * as Request from 'Requester';

new Request.RequestClient();

async function main() {
  const client1 = new RabbitMQ.Client();
  await client1.init(
    process.env.SERVER_ADDRESS as string,
    process.env.USERNAME as string,
    process.env.PASSWORD as string,
    process.env.VHOST as string);
  
  client1.receiveMessage('hello', async (message) => {
    Utils.Debug.log('CLIENT1', message);
  });
  
  client1.sendMessage('hello', 'nice to meet you');
 
  setTimeout(() => {
    Utils.Debug.log('Connection End');
    client1.free();
    process.exit(0);
  }, 500);
}

main;
