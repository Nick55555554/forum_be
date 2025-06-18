"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformError = void 0;
const transformError = (error) => {
    return Object.values(error.errors).map((err) => ({
        message: err.message,
    }));
};
exports.transformError = transformError;
