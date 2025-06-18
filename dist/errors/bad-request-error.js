"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const custom_error_1 = require("./custom-error");
class BadRequestError extends custom_error_1.CustomError {
    constructor(message) {
        super(message);
        this.message = message;
        this.statusCode = 400;
        this.message = message;
        Object.setPrototypeOf(this, BadRequestError.prototype);
    }
    serializeError() {
        return { message: this.message };
    }
}
exports.default = BadRequestError;
