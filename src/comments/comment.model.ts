import { Types, Model, Schema, model } from "mongoose";

export interface Comment {
    text: string;
    authorId: Types.ObjectId;
    meta: {
        isLiked: boolean;
        likesCount: number;
    };
    articleId: Types.ObjectId;
    commentParentId?: Types.ObjectId;
}
interface CommentDoc extends Document, Comment {
    _id: Types.ObjectId;
}

interface CommentModel extends Model<CommentDoc> {}

const commentSchema = new Schema(
    {
        text: {
            type: String,
            required: [true, "Text is required"]
        },
        authorId: {
            type: Schema.Types.ObjectId,
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
            type: Schema.Types.ObjectId,
            ref: "Article",
            required: [true, "Article id is required"]
        },
        commentParentId: {
            type: Schema.Types.ObjectId,
            ref: "Comment",
            required: false
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

const commentModel = model<Comment, CommentModel>("Comment", commentSchema);
export default commentModel;
