import { Router } from "express";
import {
    createArticle,
    getArticlesByUserId,
    getLastArticles,
    getArticleById,
    deleteArticle,
    getDrafts
} from "./article.controller";

const BASE_URL = "/articles";

const articleRouter = Router();

articleRouter.post(BASE_URL, createArticle);

articleRouter.get(BASE_URL, getLastArticles);
articleRouter.get(BASE_URL + "/author/:id", getArticlesByUserId);
articleRouter.get(BASE_URL + "/:id", getArticleById);

articleRouter.get(BASE_URL + "/drafts", getDrafts);

articleRouter.delete(BASE_URL + "/:id", deleteArticle);

export default articleRouter;
