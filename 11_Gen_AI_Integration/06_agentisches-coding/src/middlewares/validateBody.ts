import type { NextFunction, Request, Response } from 'express';
import type { ObjectSchema } from 'joi';

export function validateBody(schema: ObjectSchema) {
	return (req: Request, res: Response, next: NextFunction) => {
		const { error, value } = schema.validate(req.body, { abortEarly: false });
		if (error) {
			next(new Error(error.details.map(detail => detail.message).join(', '), { cause: 400 }));
			return;
		}
		req.body = value;
		next();
	};
}
