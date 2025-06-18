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
exports.refreshTokens = exports.logoutAllSessions = exports.logoutUser = exports.logInUser = exports.registerUser = void 0;
const mongoose_1 = require("mongoose");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("./user.model"));
const redis_client_1 = require("../redis/redis-client");
const errors_1 = require("../errors");
const transform_error_1 = require("../helpers/transform-error");
const ONE_HOUR_MS = 3600000;
const ONE_WEEK_MS = 604800000;
const REFRESH_TOKEN_TTL = 604800;
const generateSessionId = () => require("crypto").randomBytes(16).toString("hex");
const registerUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newUser = yield user_model_1.default.create(req.body);
        const sessionId = generateSessionId();
        // Генерим токены
        const accessToken = newUser.generateAccessToken();
        const refreshToken = newUser.generateRefreshToken();
        yield Promise.all([
            redis_client_1.redisClient.set(`refreshToken:${sessionId}`, refreshToken, {
                EX: REFRESH_TOKEN_TTL
            }),
            redis_client_1.redisClient.sAdd(`userSessions:${newUser._id}`, sessionId)
        ]);
        res.status(201)
            .cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: ONE_HOUR_MS
        })
            .cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: ONE_WEEK_MS
        })
            .cookie("sessionId", sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: ONE_WEEK_MS
        })
            .json({ id: newUser._id });
    }
    catch (error) {
        if (error instanceof mongoose_1.Error.ValidationError) {
            const errors = (0, transform_error_1.transformError)(error);
            return next(new errors_1.BadRequestError(errors[0].message));
        }
        if (error.message.includes("E11000")) {
            return next(new errors_1.ConflictError("Email уже занят"));
        }
        next(error);
    }
});
exports.registerUser = registerUser;
const logInUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const user = yield user_model_1.default.findUserByCredentials(email, password);
        if (!user) {
            throw new errors_1.NotFoundError();
        }
        const sessionId = generateSessionId();
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        yield Promise.all([
            redis_client_1.redisClient.set(`refreshToken:${sessionId}`, refreshToken, {
                EX: REFRESH_TOKEN_TTL
            }),
            redis_client_1.redisClient.sAdd(`userSessions:${user._id}`, sessionId)
        ]);
        // Устанавливаем куки
        res.status(200)
            .cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: ONE_HOUR_MS
        })
            .cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: ONE_WEEK_MS
        })
            .cookie("sessionId", sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: ONE_WEEK_MS
        })
            .json({ id: user._id });
    }
    catch (error) {
        if (error instanceof mongoose_1.Error.DocumentNotFoundError) {
            return next(new errors_1.NotAuthorizedError("Неверный email или пароль"));
        }
        next(error);
    }
});
exports.logInUser = logInUser;
const logoutUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(res.locals.user);
    const { id, sessionId } = res.locals.user;
    try {
        yield Promise.all([
            redis_client_1.redisClient.del(`refreshToken:${sessionId}`),
            redis_client_1.redisClient.sRem(`userSessions:${id}`, sessionId)
        ]);
        // Чистим кук
        res.clearCookie("accessToken")
            .clearCookie("refreshToken")
            .clearCookie("sessionId")
            .sendStatus(204);
    }
    catch (error) {
        next(error);
    }
});
exports.logoutUser = logoutUser;
/**
 * Выход со всех устройств
 */
const logoutAllSessions = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = res.locals.user;
    try {
        const sessions = yield redis_client_1.redisClient.sMembers(`userSessions:${id}`);
        const pipeline = redis_client_1.redisClient.multi();
        sessions.forEach((sessionId) => {
            pipeline.del(`refreshToken:${sessionId}`);
        });
        pipeline.del(`userSessions:${id}`);
        yield pipeline.exec();
        // Чистим куки
        res.clearCookie("accessToken")
            .clearCookie("refreshToken")
            .clearCookie("sessionId")
            .sendStatus(204);
    }
    catch (error) {
        next(error);
    }
});
exports.logoutAllSessions = logoutAllSessions;
/**
 * Обновление токенов
 */
const refreshTokens = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken, sessionId } = req.cookies;
    // Проверяем наличие токенов
    if (!refreshToken || !sessionId) {
        return next(new errors_1.NotAuthorizedError("Требуется авторизация"));
    }
    try {
        // Проверяем валидность refresh токена
        const storedToken = yield redis_client_1.redisClient.get(`refreshToken:${sessionId}`);
        if (refreshToken !== storedToken) {
            return next(new errors_1.NotAuthorizedError("Недействительный токен"));
        }
        // Декодируем токен
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        // Ищем пользователя
        const user = yield user_model_1.default.findById(decoded.id);
        if (!user) {
            return next(new errors_1.NotFoundError("Пользователь не найден"));
        }
        // Генерим новые токены
        const newAccessToken = user.generateAccessToken();
        const newRefreshToken = user.generateRefreshToken();
        // Обновляем токен в Redis
        yield redis_client_1.redisClient.set(`refreshToken:${sessionId}`, newRefreshToken, {
            EX: REFRESH_TOKEN_TTL
        });
        // Устанавливаем новые куки
        res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: ONE_HOUR_MS
        })
            .cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: ONE_WEEK_MS
        })
            .json({ message: "Токены обновлены" });
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            yield redis_client_1.redisClient.del(`refreshToken:${sessionId}`);
            return next({
                status: 401,
                code: "REFRESH_TOKEN_EXPIRED",
                message: "Токен истёк"
            });
        }
        next(new errors_1.NotAuthorizedError("Недействительный токен"));
    }
});
exports.refreshTokens = refreshTokens;
