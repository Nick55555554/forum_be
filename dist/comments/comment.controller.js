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
exports.updateComment = exports.deleteComment = exports.getCommentsByArticleId = exports.createComment = void 0;
const comment_model_1 = __importDefault(require("./comment.model"));
const errors_1 = require("../errors");
const article_model_1 = __importDefault(require("../articles/article.model"));
const conflict_error_1 = __importDefault(require("../errors/conflict-error"));
const like_model_1 = __importDefault(require("../likes/like.model"));
const cascade_delete_1 = require("../helpers/cascade-delete");
const createComment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const comment = req.body;
    const articleId = req.params.articleId;
    const userId = res.locals.user.id;
    comment.authorId = userId;
    comment.articleId = articleId;
    try {
        const newComment = yield comment_model_1.default.create(comment);
        yield article_model_1.default.findByIdAndUpdate(comment.articleId, {
            $push: { comments: newComment }
        });
        res.status(201).send({
            newComment: newComment
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createComment = createComment;
const getCommentsByArticleId = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const articleId = req.params.articleId;
    const userId = res.locals.user.id;
    try {
        const comments = yield comment_model_1.default.find({ articleId: articleId });
        const userLikes = yield like_model_1.default.find({
            userId: userId,
            targetType: "comment"
        });
        const likedArticleIds = new Set(userLikes.map((like) => like.targetId.toString()));
        const articlesWithLikes = comments.map((comment) => (Object.assign(Object.assign({}, comment.toObject()), { meta: Object.assign(Object.assign({}, comment.meta), { isLiked: likedArticleIds.has(comment._id.toString()) }) })));
        res.status(201).send(articlesWithLikes);
    }
    catch (error) {
        next(error);
    }
});
exports.getCommentsByArticleId = getCommentsByArticleId;
const deleteComment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const commentId = req.params.id;
    try {
        yield comment_model_1.default.findByIdAndDelete(commentId).orFail();
        yield (0, cascade_delete_1.cascadeDeleteLikes)(commentId);
        yield (0, cascade_delete_1.cascadeDeleteComments)(commentId);
        res.status(204).send({ message: "Comment has been deleted" });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteComment = deleteComment;
const updateComment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const commentId = req.params.id;
    const updatedData = req.body;
    const userId = res.locals.user.id;
    try {
        const comment = yield comment_model_1.default.findById(commentId);
        if (!comment) {
            return next(new errors_1.BadRequestError("Comment not found"));
        }
        if (userId != (comment === null || comment === void 0 ? void 0 : comment.authorId)) {
            return next(new conflict_error_1.default("You do not have permission to update this comment"));
        }
        const updatedComment = yield comment_model_1.default.findByIdAndUpdate(commentId, updatedData, {
            new: true,
            runValidators: true
        });
        res.status(200).send(updatedComment);
    }
    catch (error) {
        next(error);
    }
});
exports.updateComment = updateComment;
