import type { NextFunction, Request, Response } from 'express';
export function logger(req: Request, res: Response, next: NextFunction) {
	console.log('Time', Date.now());
	console.log(req.method);
	console.log(req.url);

	req.customProperty = 'Hello World';

	next();
}
