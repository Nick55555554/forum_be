import { createHash } from "crypto";
import { redisClient } from "./redis-client";
import { Response } from "express";

export const generateSessionId = (): string => {
    return createHash("sha256")
        .update(
            createHash("sha256").update(Date.now().toString()).digest("hex")
        )
        .digest("hex");
};

export const saveToRedis = async (
    key: string,
    data: any,
    ttl: number = 86400
): Promise<void> => {
    try {
        await redisClient.set(key, JSON.stringify(data), { EX: ttl });
    } catch (error) {
        console.error("Redis save error:", error);
        throw new Error("Failed to save data to Redis");
    }
};

export const getFromRedis = async <T = any>(key: string): Promise<T | null> => {
    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error("Redis read error:", error);
        return null;
    }
};

export const deleteByPattern = async (pattern: string): Promise<void> => {
    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length) {
            await redisClient.del(keys);
        }
    } catch (error) {
        console.error("Redis delete error:", error);
        throw new Error("Failed to delete keys from Redis");
    }
};

export const sessionManager = {
    createSession: async (
        userId: string,
        sessionData: {
            refreshToken: string;
            userAgent: string;
            ip: string;
        }
    ): Promise<{ sessionId: string }> => {
        const sessionId = generateSessionId();

        await Promise.all([
            saveToRedis(
                `session:${sessionId}`,
                {
                    userId,
                    ...sessionData,
                    createdAt: Date.now()
                },
                31 * 86400
            ),
            redisClient.sAdd(`user:sessions:${userId}`, sessionId)
        ]);

        return { sessionId };
    },

    validateSession: async (
        sessionId: string
    ): Promise<{
        userId: string;
        refreshToken: string;
    } | null> => {
        return getFromRedis(`session:${sessionId}`);
    },

    deleteSession: async (userId: string, sessionId: string): Promise<void> => {
        await Promise.all([
            redisClient.del(`session:${sessionId}`),
            redisClient.sRem(`user:sessions:${userId}`, sessionId)
        ]);
    },

    deleteAllSessions: async (userId: string): Promise<void> => {
        const sessions = await redisClient.sMembers(`user:sessions:${userId}`);
        const pipeline = redisClient.multi();

        sessions.forEach((sessionId) => {
            pipeline.del(`session:${sessionId}`);
        });

        pipeline.del(`user:sessions:${userId}`);
        await pipeline.exec();
    }
};

export const cacheResponse = async (
    res: Response,
    data: any,
    customKey?: string
): Promise<void> => {
    const cacheKey = customKey || res.locals.cacheKey;
    const ttl = res.locals.ttl || 3600;

    if (cacheKey) {
        await saveToRedis(
            `api-cache:${cacheKey}`,
            {
                data,
                timestamp: Date.now()
            },
            ttl
        );
    }
};

export const getCachedResponse = async <T = any>(
    key: string
): Promise<{
    data: T;
    timestamp: number;
} | null> => {
    return getFromRedis(`api-cache:${key}`);
};
