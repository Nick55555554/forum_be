import { redisClient } from "../redis/redis-client";
import { Request, Response, NextFunction } from "express";
import Like from "./like.model";
import { BadRequestError } from "../errors";
import {
    checkTargetExists,
    updateLikeCount,
    getLikesData,
    updateModelLikes
} from "./like.services";

const LIKE_CACHE_TTL = 60 * 60 * 24; // 24 часа

export const toggleLike = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { type, id } = req.params;
        const userId = res.locals.user.id;

        if (!(await checkTargetExists(type, id))) {
            throw new BadRequestError("Target not found");
        }

        const redisKey = `likes:${type}:${id}`;
        const statsKey = `stats:${type}:${id}`;

        const [currentCount, isLiked] = await redisClient
            .multi()
            .hGet(statsKey, "count")
            .hGet(redisKey, `user:${userId}`)
            .exec();

        const parsedCount = currentCount
            ? parseInt(currentCount as unknown as string)
            : 0;
        const userLiked = isLiked === "true";
        const newStatus = !userLiked;
        const countIncrement = newStatus ? 1 : -1;

        await redisClient
            .multi()
            .hSet(redisKey, `user:${userId}`, String(newStatus))
            .hSet(statsKey, "count", String(parsedCount + countIncrement))
            .expire(redisKey, LIKE_CACHE_TTL)
            .expire(statsKey, LIKE_CACHE_TTL)
            .exec();

        if (newStatus) {
            Like.create({ userId, targetType: type, targetId: id });
        } else {
            Like.deleteOne({ userId, targetType: type, targetId: id });
        }

        await updateModelLikes(type, id, -1);

        res.json({ isLiked: newStatus, count: parsedCount + countIncrement });
    } catch (error) {
        next(error);
    }
};

export const getLikes = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { type, id } = req.params;
        const userId = res.locals.user.id;

        const data = await getLikesData(type, id, userId);
        res.json({
            count: data.count,
            isLiked: data.isLiked,
            fromCache: data.fromCache
        });
    } catch (error) {
        next(error);
    }
};
