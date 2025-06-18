import { CustomError } from './custom-error';

export default class Conflict extends CustomError {
  statusCode = 409;

  constructor(message: string) {
    super(message);
    this.message = message;
    Object.setPrototypeOf(this, Conflict.prototype);
  }

  serializeError() {
    return { message: this.message };
  }
}
