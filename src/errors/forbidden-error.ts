import { CustomError } from './custom-error';

export default class ForbiddenError extends CustomError {
  statusCode = 403;

  constructor(public message: string) {
    super(message);
    this.message = message;
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }

  serializeError() {
    return { message: this.message };
  }
}
