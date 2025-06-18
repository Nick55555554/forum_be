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
exports.updateModelLikes = exports.getLikesData = exports.updateLikeCount = exports.checkTargetExists = void 0;
const article_model_1 = __importDefault(require("../articles/article.model"));
const comment_model_1 = __importDefault(require("../comments/comment.model"));
const like_model_1 = __importDefault(require("./like.model"));
const errors_1 = require("../errors");
const mongoose_1 = __importDefault(require("mongoose"));
const redis_client_1 = require("../redis/redis-client");
const LIKE_CACHE_TTL = 60 * 60 * 24; // 24 часа
const checkTargetExists = (type, id) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        return false;
    if (type === "articles") {
        return article_model_1.default.exists({ _id: id }).lean().then(Boolean);
    }
    else if (type === "comments") {
        return comment_model_1.default.exists({ _id: id }).lean().then(Boolean);
    }
    throw new errors_1.BadRequestError("Invalid target type");
});
exports.checkTargetExists = checkTargetExists;
const updateLikeCount = (type, id, increment) => __awaiter(void 0, void 0, void 0, function* () {
    const statsKey = `stats:${type}:${id}`;
    // Обновляем в Redis
    const [_, newCount] = yield redis_client_1.redisClient
        .multi()
        .hIncrBy(statsKey, "count", increment)
        .hGet(statsKey, "count")
        .exec();
    if (type === "articles") {
        yield article_model_1.default.findByIdAndUpdate(id, {
            $inc: { "meta.likesCount": increment }
        }).catch(console.error);
    }
    else if (type === "comments") {
        yield comment_model_1.default.findByIdAndUpdate(id, {
            $inc: { "meta.likesCount": increment }
        }).catch(console.error);
    }
    return parseInt(newCount);
});
exports.updateLikeCount = updateLikeCount;
const getLikesData = (type, id, userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const redisKey = `likes:${type}:${id}`;
    const statsKey = `stats:${type}:${id}`;
    // Пытаемся получить из Redis
    const [cachedCount, isLiked] = yield Promise.all([
        redis_client_1.redisClient.hGet(statsKey, "count"),
        userId ? redis_client_1.redisClient.hGet(redisKey, `user:${userId}`) : null
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
        const doc = yield article_model_1.default.findById(id).select("meta.likesCount").lean();
        dbCount = ((_a = doc === null || doc === void 0 ? void 0 : doc.meta) === null || _a === void 0 ? void 0 : _a.likesCount) || 0;
    }
    else if (type === "comments") {
        const doc = yield comment_model_1.default.findById(id).select("meta.likesCount").lean();
        dbCount = ((_b = doc === null || doc === void 0 ? void 0 : doc.meta) === null || _b === void 0 ? void 0 : _b.likesCount) || 0;
    }
    // Обновляем кеш
    yield redis_client_1.redisClient
        .multi()
        .hSet(statsKey, "count", dbCount.toString())
        .expire(statsKey, LIKE_CACHE_TTL)
        .exec();
    // Проверяем лайк пользователя если нужно
    let userLike = false;
    if (userId) {
        userLike = yield like_model_1.default.exists({
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
});
exports.getLikesData = getLikesData;
const updateModelLikes = (type, id, increment) => __awaiter(void 0, void 0, void 0, function* () {
    const model = type === "articles" ? article_model_1.default : comment_model_1.default;
    if (type == "articles") {
        article_model_1.default.findByIdAndUpdate(id, { $inc: { "meta.likesCount": increment } }, { new: true });
    }
    else if (type == "comments") {
        comment_model_1.default.findByIdAndUpdate(id, { $inc: { "meta.likesCount": increment } }, { new: true });
    }
});
exports.updateModelLikes = updateModelLikes;
