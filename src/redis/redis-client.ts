import { createClient } from "redis";

const redisClient = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379"
});

const connectRedis = async () => {
    redisClient.on("error", (error) => {
        console.log("Error with Redis", error);
    });

    redisClient.on("connect", () => {
        console.log("Start redis");
    });
    await redisClient.connect();
};

export { redisClient, connectRedis };
