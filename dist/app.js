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
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const user_router_1 = __importDefault(require("./users/user.router"));
const mongoose_1 = __importDefault(require("mongoose"));
const helmet_1 = __importDefault(require("helmet"));
const auth_1 = require("./middlewares/auth");
const article_router_1 = __importDefault(require("./articles/article.router"));
const redis_client_1 = require("./redis/redis-client");
const like_router_1 = __importDefault(require("./likes/like.router"));
const comments_router_1 = __importDefault(require("./comments/comments.router"));
dotenv_1.default.config();
const { PORT, MONGO_URL } = process.env;
const app = (0, express_1.default)();
app.disable("x-powered-by");
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false,
    xPoweredBy: false
}));
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cookie_parser_1.default)());
app.use(user_router_1.default);
app.use(auth_1.auth);
app.use(article_router_1.default);
app.use(comments_router_1.default);
app.use(like_router_1.default);
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(MONGO_URL);
        yield (0, redis_client_1.connectRedis)();
        app.listen(PORT, () => {
            console.log("Started on", PORT);
        });
    }
    catch (error) {
        console.error(error);
    }
});
run();
