import { CustomError } from './custom-error';

export default class NotFoundError extends CustomError {
  statusCode = 404;

  constructor(message = 'Not Found') {
    super(message);
    this.message = message;
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }

  serializeError() {
    return { message: this.message };
  }
}
