# forum_be

Backend based on Node js for pet-project
Start Mongo via Docker

```bash
docker run --name my-mongo -dit -p 27017:27017 --rm mongo:4.4.1
```

To run MongoDB commands in the terminal

```bash
docker exec -it my-mongo mongo
```

```bash
docker stop my-mongo
```

To run Redis

```bash
docker run -dit --rm --name=my-redis -p 6379:6379 redis:6.0.8
```

```bash
docker exec -it my-redis redis-cli
```

To run all

```bash
docker-compose up
```
