import { type ErrorRequestHandler } from 'express';

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.cause || 500).json({ message: err.message, stack: err.stack });
  } else {
    console.log(`Error ${err.message} \n Stack ${err.stack}`);
    res.status(err.cause || 500).json({ message: err.message });
  }
};

export default errorHandler;
