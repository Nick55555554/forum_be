import { Document, Model, Schema, model, Types } from "mongoose";
enum ArticleType {
    technologies = "technology",
    science = "science",
    culture = "culture",
    health = "health",
    business = "business",
    tourism = "tourism"
}

export interface Article {
    title: string;
    content: string;
    meta: {
        isLiked: boolean;
        likesCount: number;
        isSaved: boolean;
    };
    authorId: Types.ObjectId;
    preview: string;
    comments: Types.ObjectId[];
    type: ArticleType;
    isPublished: boolean;
    checkOwner: (userId: string) => boolean;
}

interface ArticleDoc extends Document, Article {
    _id: string;
}

interface ArticleModel extends Model<ArticleDoc> {}

const articleSchema = new Schema(
    {
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
            type: Schema.Types.ObjectId,
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
                    type: Schema.Types.ObjectId,
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
    },
    {
        timestamps: true,
        versionKey: false
    }
);

articleSchema.methods.checkOwner = function (userId: string) {
    return userId === this.authorId.toString();
};
const articleModel = model<Article, ArticleModel>("Article", articleSchema);

export default articleModel;
