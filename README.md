# Study-RabbitMQ
 
## Install RabbitMQ

Run RabbitMQ to use docker

```sh
sudo docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 --restart=unless-stopped -e RABBITMQ_DEFAULT_USER=username -e RABBITMQ_DEFAULT_PASS=password rabbitmq:management
```

> Need to change `username`, `password`

Enter the admin page

```
http://localhost:15672
```

## Install NPM Module

I used `amqplib` module. is it best popular module?

```sh
npm install amqplib
npm install @types/amqplib
```


## RabbitMQ Client

Client instance create

```typescript
const client = new AMQPClient();
```

Connect client into RabbitMQ Server

```typescript
await client.init(
  process.env.SERVER_ADDRESS as string,
  process.env.USERNAME as string,
  process.env.PASSWORD as string,
  process.env.VHOST as string);
```
Send some message into queue

```typescript
client.sendMessage('QUEUE_NAME', 'MESSAGE_CONTENT');
```

> if queue is not exist, queue will be created after enqueue the message.  
> `MESSAGE_CONTENT` is only support string now.

Receive some message from queue

```typescript
client.receiveMessage('QUEUE_NAME', async (message) => {
  console.log(message);
});

client.receiveMessage('QUEUE_NAME', async (message) => {
  console.log(message);
}, 5); // now can receive 5 message at one time. prefetch.
```

Delete the client

```typescript
client.free();
```

### Notice

1. Support Ack. Ensure reliable data processing

## Support Git History

### Credits

Based on these amazing projects:

* rhea by [JeongHyeon Kim](https://github.com/rhea-so)

### License

none
