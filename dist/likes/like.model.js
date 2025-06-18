"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
var TargetType;
(function (TargetType) {
    TargetType["ARTICLE"] = "articles";
    TargetType["COMMENT"] = "comments";
})(TargetType || (TargetType = {}));
const likeSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Types.ObjectId,
        ref: "User",
        required: true,
        index: 1
    },
    targetType: {
        type: String,
        enum: ["article", "comment"],
        required: true
    },
    targetId: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        index: 1
    },
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    versionKey: false
});
const likeModel = (0, mongoose_1.model)("Like", likeSchema);
exports.default = likeModel;
