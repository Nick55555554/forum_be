"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
var ArticleType;
(function (ArticleType) {
    ArticleType["technologies"] = "technology";
    ArticleType["science"] = "science";
    ArticleType["culture"] = "culture";
    ArticleType["health"] = "health";
    ArticleType["business"] = "business";
    ArticleType["tourism"] = "tourism";
})(ArticleType || (ArticleType = {}));
const articleSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, "Title is required"],
        minlength: [5, "Title must be at least 5 characters long"],
        maxlength: [100, "Title cannot exceed 100 characters"]
    },
    content: {
        type: String,
        required: [true, "Text is required"]
    },
    authorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: 1
    },
    preview: {
        type: String,
        required: false
    },
    meta: {
        isLiked: {
            type: Boolean,
            default: false
        },
        likesCount: {
            type: Number,
            default: 0
        },
        isSaved: {
            type: Boolean,
            default: false
        }
    },
    comments: {
        type: [
            {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "Comment"
            }
        ],
        default: []
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: -1
    },
    updatedAt: {
        type: Date
    },
    type: {
        type: String,
        enum: Object.values(ArticleType),
        required: true
    }
}, {
    timestamps: true,
    versionKey: false
});
articleSchema.methods.checkOwner = function (userId) {
    return userId === this.authorId.toString();
};
const articleModel = (0, mongoose_1.model)("Article", articleSchema);
exports.default = articleModel;
