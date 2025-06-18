import { Router } from "express";
import {
    logInUser,
    logoutUser,
    refreshTokens,
    logoutAllSessions,
    registerUser
} from "./user.controller";
import { auth as authMiddleware } from "../middlewares/auth";

const userRouter = Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", logInUser);
userRouter.delete("/logout", [authMiddleware], logoutUser);
userRouter.delete("/logoutAll", [authMiddleware], logoutAllSessions);
userRouter.post("/users/refreshTokens", refreshTokens);

export default userRouter;
