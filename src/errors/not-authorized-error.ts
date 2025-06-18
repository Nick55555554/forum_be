import { CustomError } from './custom-error';

export default class NotAuthorizedError extends CustomError {
  statusCode = 401;

  constructor(message = 'Requires authentication') {
    super(message);
    this.message = message;
    Object.setPrototypeOf(this, NotAuthorizedError.prototype);
  }

  serializeError() {
    return { message: this.message };
  }
}
