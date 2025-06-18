"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const custom_error_1 = require("./custom-error");
class NotFoundError extends custom_error_1.CustomError {
    constructor(message = 'Not Found') {
        super(message);
        this.statusCode = 404;
        this.message = message;
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
    serializeError() {
        return { message: this.message };
    }
}
exports.default = NotFoundError;
