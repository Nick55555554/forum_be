"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const custom_error_1 = require("./custom-error");
class Conflict extends custom_error_1.CustomError {
    constructor(message) {
        super(message);
        this.statusCode = 409;
        this.message = message;
        Object.setPrototypeOf(this, Conflict.prototype);
    }
    serializeError() {
        return { message: this.message };
    }
}
exports.default = Conflict;
