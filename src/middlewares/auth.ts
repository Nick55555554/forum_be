import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import NotAuthorizedError from "../errors/not-authorized-error";
import { redisClient } from "../redis/redis-client";

interface DecodedToken {
    sub: string; // ID пользователя
    iat: number; // Время создания токена
    exp?: number; // Время истечения (необязательно)
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
    const { accessToken, sessionId } = req.cookies;

    // 1. Проверка наличия токенов
    if (!accessToken || !sessionId) {
        return next(new NotAuthorizedError("Требуется авторизация"));
    }

    try {
        // 2. Верификация access token
        const decoded = jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_SECRET as string
        ) as DecodedToken;

        // 3. Проверка сессии в Redis
        const isSessionValid = await redisClient.sIsMember(
            `userSessions:${decoded.sub}`,
            sessionId
        );

        if (!isSessionValid) {
            return next(new NotAuthorizedError("Сессия недействительна"));
        }

        res.locals.user = {
            id: decoded.sub,
            sessionId: sessionId,
            tokenIssuedAt: decoded.iat
        };
        next();
    } catch (error) {
        // Обработка ошибок верификации
        if (error instanceof jwt.TokenExpiredError) {
            return next({
                status: 401,
                code: "ACCESS_TOKEN_EXPIRED",
                message: "Токен доступа истёк"
            });
        }
        next(new NotAuthorizedError("Неверный токен доступа"));
    }
};
