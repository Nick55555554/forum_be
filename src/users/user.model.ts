import { Model, Schema, Types, model } from "mongoose";
import { compare, genSalt, hash } from "bcryptjs";
import jwt from "jsonwebtoken";
import NotAuthorizedError from "../errors/not-authorized-error";
import type { Article } from "../articles/article.model";
interface User {
    email: string;
    name: string;
    password: string;
    refreshToken?: string;
    articles: Article[];
    subscriptions: Types.ObjectId[];
    savedArrticles: Article[];
}
interface UserDoc extends Document, User {
    _id: Types.ObjectId;
    generateAccessToken: () => string;
    generateRefreshToken: () => string;
    save(): Promise<this>;
}

interface UserModel extends Model<UserDoc> {
    findUserByCredentials: (
        email: string,
        password: string
    ) => Promise<UserDoc>;
}

const userSchema = new Schema(
    {
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            trim: true,
            lowercase: true,
            validate: {
                validator: (value: string) => {
                    const emailRegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    return emailRegExp.test(value);
                },
                message: "Email is not valid"
            }
        },
        subscriptions: {
            type: [Schema.Types.ObjectId],
            ref: "User",
            default: []
        },
        articles: {
            type: [Schema.Types.ObjectId],
            ref: "Article",
            default: []
        },
        savedArrticles: {
            type: [Schema.Types.ObjectId],
            ref: "Article",
            default: []
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            trim: true,
            minlength: 6,
            select: false
        },
        refreshToken: {
            type: String,
            select: false
        },
        accessToken: {
            type: String,
            select: false
        }
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: {
            transform: (_doc: any, ret: any) => {
                delete ret.password;
                delete ret.accessToken;
                delete ret.refreshToken;

                return ret;
            }
        }
    }
);

userSchema.pre("save", async function (next) {
    try {
        if (this.isModified("password")) {
            const salt = await genSalt(8);
            this.password = await hash(this.password, salt);
        }
    } catch (error) {
        next(error as Error);
    }
});

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            sub: this._id.toString(),
            iat: Math.floor(Date.now() / 1000)
        },
        process.env.ACCESS_TOKEN_SECRET as string,
        {
            expiresIn: "1h"
        }
    );
};
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            sub: this._id.toString(),
            iat: Math.floor(Date.now() / 1000)
        },
        process.env.REFRESH_TOKEN_SECRET as string,
        { expiresIn: "31d" }
    );
};

userSchema.statics.findUserByCredentials = async function (
    email: string,
    password: string
) {
    const user = await this.findOne({ email })
        .select("+password")
        .orFail(() => new NotAuthorizedError());

    const isCorrectPass = await compare(password, user.password);

    if (isCorrectPass) return user;
    throw new NotAuthorizedError("Invalid credentials");
};

const userModel = model<User, UserModel>("User", userSchema);

export default userModel;
