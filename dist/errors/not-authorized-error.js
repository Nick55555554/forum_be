"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const custom_error_1 = require("./custom-error");
class NotAuthorizedError extends custom_error_1.CustomError {
    constructor(message = 'Requires authentication') {
        super(message);
        this.statusCode = 401;
        this.message = message;
        Object.setPrototypeOf(this, NotAuthorizedError.prototype);
    }
    serializeError() {
        return { message: this.message };
    }
}
exports.default = NotAuthorizedError;
