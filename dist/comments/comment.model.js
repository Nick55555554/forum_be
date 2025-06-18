"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const commentSchema = new mongoose_1.Schema({
    text: {
        type: String,
        required: [true, "Text is required"]
    },
    authorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: [true, "Author is required"],
        ref: "User",
        index: 1
    },
    meta: {
        isLiked: {
            type: Boolean,
            default: false
        },
        likesCount: {
            type: Number,
            default: 0
        }
    },
    articleId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Article",
        required: [true, "Article id is required"]
    },
    commentParentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Comment",
        required: false
    }
}, {
    timestamps: true,
    versionKey: false
});
const commentModel = (0, mongoose_1.model)("Comment", commentSchema);
exports.default = commentModel;
