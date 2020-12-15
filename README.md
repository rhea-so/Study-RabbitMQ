# Study-RabbitMQ
 
## Install

Run RabbitMQ to use docker

```sh
sudo docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 --restart=unless-stopped -e RABBITMQ_DEFAULT_USER=username -e RABBITMQ_DEFAULT_PASS=password rabbitmq:management
```

> Need to change `username`, `password`

Enter the admin page

```
http://localhost:15672
```

## Support Git History

### Credits

Based on these amazing projects:

* rhea by [JeongHyeon Kim](https://github.com/rhea-so)

### License

none
