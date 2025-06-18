import { Response, Request, NextFunction } from "express";
import { Error as MongooseError } from "mongoose";
import jwt from "jsonwebtoken";
import User from "./user.model";
import { redisClient } from "../redis/redis-client";
import {
    BadRequestError,
    ConflictError,
    NotFoundError,
    NotAuthorizedError
} from "../errors";
import { transformError } from "../helpers/transform-error";

const ONE_HOUR_MS = 3600000;
const ONE_WEEK_MS = 604800000;
const REFRESH_TOKEN_TTL = 604800;

const generateSessionId = () =>
    require("crypto").randomBytes(16).toString("hex");

export const registerUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const newUser = await User.create(req.body);
        const sessionId = generateSessionId();

        // Генерим токены
        const accessToken = newUser.generateAccessToken();
        const refreshToken = newUser.generateRefreshToken();

        await Promise.all([
            redisClient.set(`refreshToken:${sessionId}`, refreshToken, {
                EX: REFRESH_TOKEN_TTL
            }),
            redisClient.sAdd(`userSessions:${newUser._id}`, sessionId)
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
    } catch (error) {
        if (error instanceof MongooseError.ValidationError) {
            const errors = transformError(error);
            return next(new BadRequestError(errors[0].message));
        }
        if ((error as Error).message.includes("E11000")) {
            return next(new ConflictError("Email уже занят"));
        }
        next(error);
    }
};

export const logInUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { email, password } = req.body;

    try {
        const user = await User.findUserByCredentials(email, password);
        if (!user) {
            throw new NotFoundError();
        }

        const sessionId = generateSessionId();

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        await Promise.all([
            redisClient.set(`refreshToken:${sessionId}`, refreshToken, {
                EX: REFRESH_TOKEN_TTL
            }),
            redisClient.sAdd(`userSessions:${user._id}`, sessionId)
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
    } catch (error) {
        if (error instanceof MongooseError.DocumentNotFoundError) {
            return next(new NotAuthorizedError("Неверный email или пароль"));
        }
        next(error);
    }
};

export const logoutUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.log(res.locals.user);
    const { id, sessionId } = res.locals.user;

    try {
        await Promise.all([
            redisClient.del(`refreshToken:${sessionId}`),
            redisClient.sRem(`userSessions:${id}`, sessionId)
        ]);

        // Чистим кук
        res.clearCookie("accessToken")
            .clearCookie("refreshToken")
            .clearCookie("sessionId")
            .sendStatus(204);
    } catch (error) {
        next(error);
    }
};

/**
 * Выход со всех устройств
 */
export const logoutAllSessions = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { id } = res.locals.user;

    try {
        const sessions = await redisClient.sMembers(`userSessions:${id}`);

        const pipeline = redisClient.multi();
        sessions.forEach((sessionId) => {
            pipeline.del(`refreshToken:${sessionId}`);
        });
        pipeline.del(`userSessions:${id}`);
        await pipeline.exec();

        // Чистим куки
        res.clearCookie("accessToken")
            .clearCookie("refreshToken")
            .clearCookie("sessionId")
            .sendStatus(204);
    } catch (error) {
        next(error);
    }
};

/**
 * Обновление токенов
 */
export const refreshTokens = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { refreshToken, sessionId } = req.cookies;

    // Проверяем наличие токенов
    if (!refreshToken || !sessionId) {
        return next(new NotAuthorizedError("Требуется авторизация"));
    }

    try {
        // Проверяем валидность refresh токена
        const storedToken = await redisClient.get(`refreshToken:${sessionId}`);
        if (refreshToken !== storedToken) {
            return next(new NotAuthorizedError("Недействительный токен"));
        }

        // Декодируем токен
        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET as string
        ) as { id: string };

        // Ищем пользователя
        const user = await User.findById(decoded.id);
        if (!user) {
            return next(new NotFoundError("Пользователь не найден"));
        }

        // Генерим новые токены
        const newAccessToken = user.generateAccessToken();
        const newRefreshToken = user.generateRefreshToken();

        // Обновляем токен в Redis
        await redisClient.set(`refreshToken:${sessionId}`, newRefreshToken, {
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
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            await redisClient.del(`refreshToken:${sessionId}`);
            return next({
                status: 401,
                code: "REFRESH_TOKEN_EXPIRED",
                message: "Токен истёк"
            });
        }
        next(new NotAuthorizedError("Недействительный токен"));
    }
};
