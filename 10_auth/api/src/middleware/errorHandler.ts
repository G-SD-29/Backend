import { type ErrorRequestHandler } from 'express';

type ErrorPayLoad = {
  message: string;
  code?: string;
};

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  process.env.NODE_ENV !== 'production' && console.log(`\x1b[31m${err.stack}\x1b[0m`);

  if (err instanceof Error) {
    const payload: ErrorPayLoad = { message: err.message };

    if (err.cause) {
      const cause = err.cause as { status: number; code?: string };

      if (cause.code === 'ACCESS_TOKEN_EXPIRED') {
        console.log('access token expired');
        res.setHeader('WWW-Authenticate', 'Bearer error="token_expired", error_description="The access token expired"');
        res.status(cause.status ?? 500).json(payload);
        return;
      }
    }
    res.status(500).json(payload);
    return;
  }
  res.status(500).json({ message: 'Interal server error' });
  return;
};

export default errorHandler;
