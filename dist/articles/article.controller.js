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
exports.toggleSave = exports.getDrafts = exports.deleteArticle = exports.getArticlesByUserId = exports.getArticleById = exports.getLastArticles = exports.createArticle = void 0;
const article_model_1 = __importDefault(require("./article.model"));
const like_model_1 = __importDefault(require("../likes/like.model"));
const mongoose_1 = require("mongoose");
const errors_1 = require("../errors");
const cascade_delete_1 = require("../helpers/cascade-delete");
const createArticle = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const article = req.body;
    const userId = res.locals.user.id;
    article.authorId = userId;
    try {
        const newArticle = yield article_model_1.default.create(article);
        res.status(201).send({
            newArticle
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createArticle = createArticle;
const getLastArticles = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit } = req.body;
    const userId = res.locals.user.id;
    try {
        const articles = yield article_model_1.default.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        const userLikes = yield like_model_1.default.find({
            userId: userId,
            targetType: "article"
        });
        const likedArticleIds = new Set(userLikes.map((like) => like.targetId.toString()));
        const articlesWithLikes = articles.map((article) => (Object.assign(Object.assign({}, article.toObject()), { meta: Object.assign(Object.assign({}, article.meta), { isLiked: likedArticleIds.has(article._id.toString()) }) })));
        res.status(200).send(articlesWithLikes);
    }
    catch (error) {
        if (error instanceof mongoose_1.Error.DocumentNotFoundError) {
            return next(new errors_1.NotFoundError("Articles not found"));
        }
    }
});
exports.getLastArticles = getLastArticles;
const getArticleById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const userId = res.locals.user.id;
    try {
        const article = yield article_model_1.default.findById(id)
            .orFail(new errors_1.NotFoundError("Invalid ID"))
            .populate("comments");
        const isLiked = yield like_model_1.default.findOne({ author: userId });
        if (isLiked)
            article.meta.isLiked = true;
        else
            article.meta.isLiked = false;
        res.status(200).send({ article });
    }
    catch (error) {
        next(error);
    }
});
exports.getArticleById = getArticleById;
const getArticlesByUserId = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.id;
    try {
        const articles = yield article_model_1.default.find({
            authorId: userId,
            isPublished: true
        }).populate("comments");
        const userLikes = yield like_model_1.default.find({
            userId: userId,
            targetType: "article"
        });
        const likedArticleIds = new Set(userLikes.map((like) => like.targetId.toString()));
        const articlesWithLikes = articles.map((article) => (Object.assign(Object.assign({}, article.toObject()), { meta: Object.assign(Object.assign({}, article.meta), { isLiked: likedArticleIds.has(article._id.toString()) }) })));
        res.status(200).send(articlesWithLikes);
    }
    catch (error) {
        next(error);
    }
});
exports.getArticlesByUserId = getArticlesByUserId;
const deleteArticle = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const userId = res.locals.user.id;
    try {
        const article = yield article_model_1.default.findById(id).orFail(new errors_1.NotFoundError("Article not found"));
        if (!article.checkOwner(userId)) {
            return next(new errors_1.ForbiddenError("You have no access to this resource"));
        }
        yield article_model_1.default.findByIdAndDelete(id);
        yield (0, cascade_delete_1.cascadeDeleteLikes)(id);
        yield (0, cascade_delete_1.cascadeDeleteComments)(id);
        res.send({ id });
    }
    catch (error) {
        if (error instanceof mongoose_1.Error.CastError) {
            return next(new errors_1.BadRequestError("Invalid ID"));
        }
        if (error instanceof mongoose_1.Error.DocumentNotFoundError) {
            return next(new errors_1.NotFoundError("Article not found"));
        }
        next(error);
    }
});
exports.deleteArticle = deleteArticle;
const getDrafts = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = res.locals.user.id;
    try {
        const articles = yield article_model_1.default.find({
            authorId: userId,
            isPublished: false
        });
        res.status(200).send({ articles });
    }
    catch (error) {
        next(error);
    }
});
exports.getDrafts = getDrafts;
const toggleSave = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const articleId = req.params.id;
    const userId = res.locals.user.id;
    try {
        const article = yield article_model_1.default.findById(articleId);
        if (!article) {
            return next(new errors_1.NotFoundError("Article not exist"));
        }
        if (article.meta.isSaved) {
        }
    }
    catch (error) {
        next(error);
    }
});
exports.toggleSave = toggleSave;
