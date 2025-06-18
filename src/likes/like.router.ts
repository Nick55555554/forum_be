import { Router } from "express";
import { getLikes, toggleLike } from "./like.controller";

const likeRouter = Router();

likeRouter.post("/likes/:type/:id/", toggleLike);

likeRouter.get("/likes", getLikes);

export default likeRouter;
