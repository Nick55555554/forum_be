"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const like_controller_1 = require("./like.controller");
const likeRouter = (0, express_1.Router)();
likeRouter.post("/likes/:type/:id/", like_controller_1.toggleLike);
likeRouter.get("/likes", like_controller_1.getLikes);
exports.default = likeRouter;
