"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCachedResponse = exports.cacheResponse = exports.sessionManager = exports.deleteByPattern = exports.getFromRedis = exports.saveToRedis = exports.generateSessionId = void 0;
const crypto_1 = require("crypto");
const redis_client_1 = require("./redis-client");
const generateSessionId = () => {
    return (0, crypto_1.createHash)("sha256")
        .update((0, crypto_1.createHash)("sha256").update(Date.now().toString()).digest("hex"))
        .digest("hex");
};
exports.generateSessionId = generateSessionId;
const saveToRedis = (key_1, data_1, ...args_1) => __awaiter(void 0, [key_1, data_1, ...args_1], void 0, function* (key, data, ttl = 86400) {
    try {
        yield redis_client_1.redisClient.set(key, JSON.stringify(data), { EX: ttl });
    }
    catch (error) {
        console.error("Redis save error:", error);
        throw new Error("Failed to save data to Redis");
    }
});
exports.saveToRedis = saveToRedis;
const getFromRedis = (key) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield redis_client_1.redisClient.get(key);
        return data ? JSON.parse(data) : null;
    }
    catch (error) {
        console.error("Redis read error:", error);
        return null;
    }
});
exports.getFromRedis = getFromRedis;
const deleteByPattern = (pattern) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const keys = yield redis_client_1.redisClient.keys(pattern);
        if (keys.length) {
            yield redis_client_1.redisClient.del(keys);
        }
    }
    catch (error) {
        console.error("Redis delete error:", error);
        throw new Error("Failed to delete keys from Redis");
    }
});
exports.deleteByPattern = deleteByPattern;
exports.sessionManager = {
    createSession: (userId, sessionData) => __awaiter(void 0, void 0, void 0, function* () {
        const sessionId = (0, exports.generateSessionId)();
        yield Promise.all([
            (0, exports.saveToRedis)(`session:${sessionId}`, Object.assign(Object.assign({ userId }, sessionData), { createdAt: Date.now() }), 31 * 86400),
            redis_client_1.redisClient.sAdd(`user:sessions:${userId}`, sessionId)
        ]);
        return { sessionId };
    }),
    validateSession: (sessionId) => __awaiter(void 0, void 0, void 0, function* () {
        return (0, exports.getFromRedis)(`session:${sessionId}`);
    }),
    deleteSession: (userId, sessionId) => __awaiter(void 0, void 0, void 0, function* () {
        yield Promise.all([
            redis_client_1.redisClient.del(`session:${sessionId}`),
            redis_client_1.redisClient.sRem(`user:sessions:${userId}`, sessionId)
        ]);
    }),
    deleteAllSessions: (userId) => __awaiter(void 0, void 0, void 0, function* () {
        const sessions = yield redis_client_1.redisClient.sMembers(`user:sessions:${userId}`);
        const pipeline = redis_client_1.redisClient.multi();
        sessions.forEach((sessionId) => {
            pipeline.del(`session:${sessionId}`);
        });
        pipeline.del(`user:sessions:${userId}`);
        yield pipeline.exec();
    })
};
const cacheResponse = (res, data, customKey) => __awaiter(void 0, void 0, void 0, function* () {
    const cacheKey = customKey || res.locals.cacheKey;
    const ttl = res.locals.ttl || 3600;
    if (cacheKey) {
        yield (0, exports.saveToRedis)(`api-cache:${cacheKey}`, {
            data,
            timestamp: Date.now()
        }, ttl);
    }
});
exports.cacheResponse = cacheResponse;
const getCachedResponse = (key) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, exports.getFromRedis)(`api-cache:${key}`);
});
exports.getCachedResponse = getCachedResponse;
