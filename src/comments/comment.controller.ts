import { NextFunction, Request, Response } from "express";
import Comment from "./comment.model";
import { BadRequestError } from "../errors";
import Article from "../articles/article.model";
import Conflict from "../errors/conflict-error";
import Like from "../likes/like.model";
import {
    cascadeDeleteComments,
    cascadeDeleteLikes
} from "../helpers/cascade-delete";

export const createComment = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const comment = req.body;
    const articleId = req.params.articleId;
    const userId = res.locals.user.id;

    comment.authorId = userId;
    comment.articleId = articleId;

    try {
        const newComment = await Comment.create(comment);

        await Article.findByIdAndUpdate(comment.articleId, {
            $push: { comments: newComment }
        });

        res.status(201).send({
            newComment: newComment
        });
    } catch (error) {
        next(error);
    }
};

export const getCommentsByArticleId = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const articleId = req.params.articleId;
    const userId = res.locals.user.id;

    try {
        const comments = await Comment.find({ articleId: articleId });

        const userLikes = await Like.find({
            userId: userId,
            targetType: "comment"
        });

        const likedArticleIds = new Set(
            userLikes.map((like) => like.targetId.toString())
        );

        const articlesWithLikes = comments.map((comment) => ({
            ...comment.toObject(),
            meta: {
                ...comment.meta,
                isLiked: likedArticleIds.has(comment._id.toString())
            }
        }));

        res.status(201).send(articlesWithLikes);
    } catch (error) {
        next(error);
    }
};

export const deleteComment = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const commentId = req.params.id;
    try {
        await Comment.findByIdAndDelete(commentId).orFail();

        await cascadeDeleteLikes(commentId);

        await cascadeDeleteComments(commentId);

        res.status(204).send({ message: "Comment has been deleted" });
    } catch (error) {
        next(error);
    }
};

export const updateComment = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const commentId = req.params.id;
    const updatedData = req.body;
    const userId = res.locals.user.id;
    try {
        const comment = await Comment.findById(commentId);

        if (!comment) {
            return next(new BadRequestError("Comment not found"));
        }

        if (userId != comment?.authorId) {
            return next(
                new Conflict(
                    "You do not have permission to update this comment"
                )
            );
        }
        const updatedComment = await Comment.findByIdAndUpdate(
            commentId,
            updatedData,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).send(updatedComment);
    } catch (error) {
        next(error);
    }
};
