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
exports.auth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const not_authorized_error_1 = __importDefault(require("../errors/not-authorized-error"));
const redis_client_1 = require("../redis/redis-client");
const auth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { accessToken, sessionId } = req.cookies;
    // 1. Проверка наличия токенов
    if (!accessToken || !sessionId) {
        return next(new not_authorized_error_1.default("Требуется авторизация"));
    }
    try {
        // 2. Верификация access token
        const decoded = jsonwebtoken_1.default.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        // 3. Проверка сессии в Redis
        const isSessionValid = yield redis_client_1.redisClient.sIsMember(`userSessions:${decoded.sub}`, sessionId);
        if (!isSessionValid) {
            return next(new not_authorized_error_1.default("Сессия недействительна"));
        }
        res.locals.user = {
            id: decoded.sub,
            sessionId: sessionId,
            tokenIssuedAt: decoded.iat
        };
        next();
    }
    catch (error) {
        // Обработка ошибок верификации
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return next({
                status: 401,
                code: "ACCESS_TOKEN_EXPIRED",
                message: "Токен доступа истёк"
            });
        }
        next(new not_authorized_error_1.default("Неверный токен доступа"));
    }
});
exports.auth = auth;
