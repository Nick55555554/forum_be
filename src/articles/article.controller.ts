import { Response, Request, NextFunction } from "express";
import Article from "./article.model";
import Like from "../likes/like.model";
import { Error as MongooseError } from "mongoose";
import { BadRequestError, ForbiddenError, NotFoundError } from "../errors";
import {
    cascadeDeleteComments,
    cascadeDeleteLikes
} from "../helpers/cascade-delete";

export const createArticle = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const article = req.body;
    const userId = res.locals.user.id;
    article.authorId = userId;
    try {
        const newArticle = await Article.create(article);

        res.status(201).send({
            newArticle
        });
    } catch (error) {
        next(error);
    }
};

export const getLastArticles = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { page, limit } = req.body;

    const userId = res.locals.user.id;
    try {
        const articles = await Article.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const userLikes = await Like.find({
            userId: userId,
            targetType: "article"
        });

        const likedArticleIds = new Set(
            userLikes.map((like) => like.targetId.toString())
        );

        const articlesWithLikes = articles.map((article) => ({
            ...article.toObject(),
            meta: {
                ...article.meta,
                isLiked: likedArticleIds.has(article._id.toString())
            }
        }));

        res.status(200).send(articlesWithLikes);
    } catch (error) {
        if (error instanceof MongooseError.DocumentNotFoundError) {
            return next(new NotFoundError("Articles not found"));
        }
    }
};

export const getArticleById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const id = req.params.id;

    const userId = res.locals.user.id;

    try {
        const article = await Article.findById(id)
            .orFail(new NotFoundError("Invalid ID"))
            .populate("comments");

        const isLiked = await Like.findOne({ author: userId });

        if (isLiked) article.meta.isLiked = true;
        else article.meta.isLiked = false;

        res.status(200).send({ article });
    } catch (error) {
        next(error);
    }
};

export const getArticlesByUserId = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const userId = req.params.id;

    try {
        const articles = await Article.find({
            authorId: userId,
            isPublished: true
        }).populate("comments");

        const userLikes = await Like.find({
            userId: userId,
            targetType: "article"
        });

        const likedArticleIds = new Set(
            userLikes.map((like) => like.targetId.toString())
        );

        const articlesWithLikes = articles.map((article) => ({
            ...article.toObject(),
            meta: {
                ...article.meta,
                isLiked: likedArticleIds.has(article._id.toString())
            }
        }));

        res.status(200).send(articlesWithLikes);
    } catch (error) {
        next(error);
    }
};

export const deleteArticle = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const id = req.params.id;
    const userId = res.locals.user.id;
    try {
        const article = await Article.findById(id).orFail(
            new NotFoundError("Article not found")
        );

        if (!article.checkOwner(userId)) {
            return next(
                new ForbiddenError("You have no access to this resource")
            );
        }
        await Article.findByIdAndDelete(id);

        await cascadeDeleteLikes(id);

        await cascadeDeleteComments(id);

        res.send({ id });
    } catch (error) {
        if (error instanceof MongooseError.CastError) {
            return next(new BadRequestError("Invalid ID"));
        }

        if (error instanceof MongooseError.DocumentNotFoundError) {
            return next(new NotFoundError("Article not found"));
        }

        next(error);
    }
};

export const getDrafts = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const userId = res.locals.user.id;

    try {
        const articles = await Article.find({
            authorId: userId,
            isPublished: false
        });

        res.status(200).send({ articles });
    } catch (error) {
        next(error);
    }
};

export const toggleSave = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const articleId = req.params.id;

    const userId = res.locals.user.id;

    try {
        const article = await Article.findById(articleId);

        if (!article) {
            return next(new NotFoundError("Article not exist"));
        }

        if (article.meta.isSaved) {
        }
    } catch (error) {
        next(error);
    }
};
