import { Schema, model, Types, Model } from "mongoose";

enum TargetType {
    ARTICLE = "articles",
    COMMENT = "comments"
}
interface Like {
    userId: Types.ObjectId;
    targetType: TargetType;
    targetId: Types.ObjectId;
}

interface LikeDoc extends Document, Like {}

interface LikeModel extends Model<LikeDoc> {}

const likeSchema = new Schema(
    {
        userId: {
            type: Types.ObjectId,
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
            type: Types.ObjectId,
            required: true,
            index: 1
        },
        createdAt: { type: Date, default: Date.now }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

const likeModel = model<Like, LikeModel>("Like", likeSchema);
export default likeModel;
