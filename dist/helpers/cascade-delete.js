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
exports.cascadeDeleteComments = exports.cascadeDeleteLikes = void 0;
const like_model_1 = __importDefault(require("../likes/like.model"));
const comment_model_1 = __importDefault(require("../comments/comment.model"));
const cascadeDeleteLikes = (targetId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield like_model_1.default.deleteMany({ targetId: targetId });
        return true;
    }
    catch (error) {
        throw new Error("Failed delete cascade likes");
    }
});
exports.cascadeDeleteLikes = cascadeDeleteLikes;
const cascadeDeleteComments = (targetId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield comment_model_1.default.deleteMany({ targetId: targetId });
        return true;
    }
    catch (error) {
        throw new Error("Failed delete cascade likes");
    }
});
exports.cascadeDeleteComments = cascadeDeleteComments;
