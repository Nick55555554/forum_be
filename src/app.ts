import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieparser from "cookie-parser";
import userRouter from "./users/user.router";
import mongoose from "mongoose";
import helmet from "helmet";
import { auth as authMiddleware } from "./middlewares/auth";
import articleRouter from "./articles/article.router";
import { connectRedis } from "./redis/redis-client";
import likeRouter from "./likes/like.router";
import commentRouter from "./comments/comments.router";
dotenv.config();
const { PORT, MONGO_URL } = process.env;

const app = express();

app.disable("x-powered-by");
app.use(
    helmet({
        contentSecurityPolicy: false,
        xPoweredBy: false
    })
);

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieparser());

app.use(userRouter);

app.use(authMiddleware);

app.use(articleRouter);

app.use(commentRouter);

app.use(likeRouter);

const run = async () => {
    try {
        await mongoose.connect(MONGO_URL as string);
        await connectRedis();
        app.listen(PORT, () => {
            console.log("Started on", PORT);
        });
    } catch (error) {
        console.error(error);
    }
};

run();
