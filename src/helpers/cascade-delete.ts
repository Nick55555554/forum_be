import { NextFunction, Request, Response } from "express";
import Like from "../likes/like.model";
import Comment from "../comments/comment.model";

export const cascadeDeleteLikes = async (targetId: string) => {
    try {
        await Like.deleteMany({ targetId: targetId });
        return true;
    } catch (error) {
        throw new Error("Failed delete cascade likes");
    }
};

export const cascadeDeleteComments = async (targetId: string) => {
    try {
        await Comment.deleteMany({ targetId: targetId });
        return true;
    } catch (error) {
        throw new Error("Failed delete cascade likes");
    }
};
