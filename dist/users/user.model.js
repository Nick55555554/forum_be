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
const mongoose_1 = require("mongoose");
const bcryptjs_1 = require("bcryptjs");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const not_authorized_error_1 = __importDefault(require("../errors/not-authorized-error"));
const userSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: (value) => {
                const emailRegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegExp.test(value);
            },
            message: "Email is not valid"
        }
    },
    subscriptions: {
        type: [mongoose_1.Schema.Types.ObjectId],
        ref: "User",
        default: []
    },
    articles: {
        type: [mongoose_1.Schema.Types.ObjectId],
        ref: "Article",
        default: []
    },
    savedArrticles: {
        type: [mongoose_1.Schema.Types.ObjectId],
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
}, {
    timestamps: true,
    versionKey: false,
    toJSON: {
        transform: (_doc, ret) => {
            delete ret.password;
            delete ret.accessToken;
            delete ret.refreshToken;
            return ret;
        }
    }
});
userSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (this.isModified("password")) {
                const salt = yield (0, bcryptjs_1.genSalt)(8);
                this.password = yield (0, bcryptjs_1.hash)(this.password, salt);
            }
        }
        catch (error) {
            next(error);
        }
    });
});
userSchema.methods.generateAccessToken = function () {
    return jsonwebtoken_1.default.sign({
        sub: this._id.toString(),
        iat: Math.floor(Date.now() / 1000)
    }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h"
    });
};
userSchema.methods.generateRefreshToken = function () {
    return jsonwebtoken_1.default.sign({
        sub: this._id.toString(),
        iat: Math.floor(Date.now() / 1000)
    }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "31d" });
};
userSchema.statics.findUserByCredentials = function (email, password) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield this.findOne({ email })
            .select("+password")
            .orFail(() => new not_authorized_error_1.default());
        const isCorrectPass = yield (0, bcryptjs_1.compare)(password, user.password);
        if (isCorrectPass)
            return user;
        throw new not_authorized_error_1.default("Invalid credentials");
    });
};
const userModel = (0, mongoose_1.model)("User", userSchema);
exports.default = userModel;
