import { Router } from "express";
import {
    createComment,
    deleteComment,
    getCommentsByArticleId,
    updateComment
} from "./comment.controller";

const commentRouter = Router();

commentRouter.post("/comments/:articleId", createComment);

commentRouter.get("/comments/:articleId", getCommentsByArticleId);

commentRouter.delete("/comments/:id", deleteComment);

commentRouter.patch("/comments/:id", updateComment);

export default commentRouter;
