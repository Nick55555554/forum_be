import { Error } from 'mongoose';

export const transformError = (error: Error.ValidationError) => {
  return Object.values(error.errors).map((err) => ({
    message: err.message,
  }));
};
