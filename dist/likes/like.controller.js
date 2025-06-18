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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLikes = exports.toggleLike = void 0;
const redis_client_1 = require("../redis/redis-client");
const like_model_1 = __importDefault(require("./like.model"));
const errors_1 = require("../errors");
const like_services_1 = require("./like.services");
const LIKE_CACHE_TTL = 60 * 60 * 24; // 24 часа
const toggleLike = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type, id } = req.params;
        const userId = res.locals.user.id;
        if (!(yield (0, like_services_1.checkTargetExists)(type, id))) {
            throw new errors_1.BadRequestError("Target not found");
        }
        const redisKey = `likes:${type}:${id}`;
        const statsKey = `stats:${type}:${id}`;
        const [currentCount, isLiked] = yield redis_client_1.redisClient
            .multi()
            .hGet(statsKey, "count")
            .hGet(redisKey, `user:${userId}`)
            .exec();
        const parsedCount = currentCount
            ? parseInt(currentCount)
            : 0;
        const userLiked = isLiked === "true";
        const newStatus = !userLiked;
        const countIncrement = newStatus ? 1 : -1;
        yield redis_client_1.redisClient
            .multi()
            .hSet(redisKey, `user:${userId}`, String(newStatus))
            .hSet(statsKey, "count", String(parsedCount + countIncrement))
            .expire(redisKey, LIKE_CACHE_TTL)
            .expire(statsKey, LIKE_CACHE_TTL)
            .exec();
        if (newStatus) {
            like_model_1.default.create({ userId, targetType: type, targetId: id });
        }
        else {
            like_model_1.default.deleteOne({ userId, targetType: type, targetId: id });
        }
        yield (0, like_services_1.updateModelLikes)(type, id, -1);
        res.json({ isLiked: newStatus, count: parsedCount + countIncrement });
    }
    catch (error) {
        next(error);
    }
});
exports.toggleLike = toggleLike;
const getLikes = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type, id } = req.params;
        const userId = res.locals.user.id;
        const data = yield (0, like_services_1.getLikesData)(type, id, userId);
        res.json({
            count: data.count,
            isLiked: data.isLiked,
            fromCache: data.fromCache
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getLikes = getLikes;
