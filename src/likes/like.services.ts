import Article from "../articles/article.model";
import Comment from "../comments/comment.model";
import Like from "./like.model";
import { BadRequestError } from "../errors";
import mongoose from "mongoose";
import { redisClient } from "../redis/redis-client";

const LIKE_CACHE_TTL = 60 * 60 * 24; // 24 часа

export const checkTargetExists = async (type: string, id: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;

    if (type === "articles") {
        return Article.exists({ _id: id }).lean().then(Boolean);
    } else if (type === "comments") {
        return Comment.exists({ _id: id }).lean().then(Boolean);
    }
    throw new BadRequestError("Invalid target type");
};

export const updateLikeCount = async (
    type: string,
    id: string,
    increment: number
) => {
    const statsKey = `stats:${type}:${id}`;

    // Обновляем в Redis
    const [_, newCount] = await redisClient
        .multi()
        .hIncrBy(statsKey, "count", increment)
        .hGet(statsKey, "count")
        .exec();

    if (type === "articles") {
        await Article.findByIdAndUpdate(id, {
            $inc: { "meta.likesCount": increment }
        }).catch(console.error);
    } else if (type === "comments") {
        await Comment.findByIdAndUpdate(id, {
            $inc: { "meta.likesCount": increment }
        }).catch(console.error);
    }

    return parseInt(newCount as unknown as string);
};

export const getLikesData = async (
    type: string,
    id: string,
    userId?: string
) => {
    const redisKey = `likes:${type}:${id}`;
    const statsKey = `stats:${type}:${id}`;

    // Пытаемся получить из Redis
    const [cachedCount, isLiked] = await Promise.all([
        redisClient.hGet(statsKey, "count"),
        userId ? redisClient.hGet(redisKey, `user:${userId}`) : null
    ]);

    if (cachedCount) {
        return {
            count: parseInt(cachedCount),
            isLiked: isLiked === "true",
            fromCache: true
        };
    }

    let dbCount = 0;
    if (type === "articles") {
        const doc = await Article.findById(id).select("meta.likesCount").lean();
        dbCount = doc?.meta?.likesCount || 0;
    } else if (type === "comments") {
        const doc = await Comment.findById(id).select("meta.likesCount").lean();
        dbCount = doc?.meta?.likesCount || 0;
    }

    // Обновляем кеш
    await redisClient
        .multi()
        .hSet(statsKey, "count", dbCount.toString())
        .expire(statsKey, LIKE_CACHE_TTL)
        .exec();

    // Проверяем лайк пользователя если нужно
    let userLike = false;
    if (userId) {
        userLike = await Like.exists({
            userId,
            targetType: type,
            targetId: id
        }).then(Boolean);
    }

    return {
        count: dbCount,
        isLiked: userLike,
        fromCache: false
    };
};

export const updateModelLikes = async (
    type: string,
    id: string,
    increment: number
) => {
    const model = type === "articles" ? Article : Comment;
    if (type == "articles") {
        Article.findByIdAndUpdate(
            id,
            { $inc: { "meta.likesCount": increment } },
            { new: true }
        );
    } else if (type == "comments") {
        Comment.findByIdAndUpdate(
            id,
            { $inc: { "meta.likesCount": increment } },
            { new: true }
        );
    }
};
