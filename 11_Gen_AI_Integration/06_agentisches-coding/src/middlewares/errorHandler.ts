import type { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
	const status = typeof err.cause === 'number' ? err.cause : err.name === 'CastError' ? 400 : 500;
	res.status(status).json({ message: err.message ?? 'Internal server error' });
};
