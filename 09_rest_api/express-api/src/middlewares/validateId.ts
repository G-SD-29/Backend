import { isValidObjectId } from 'mongoose';
import type { Request, Response, NextFunction } from 'express';

export function validateId(req: Request, res: Response, next: NextFunction) {
	const { id } = req.params;
	if (!isValidObjectId(id)) {
		return res.json({ message: 'ID not valid' });
	}

	next();
}
