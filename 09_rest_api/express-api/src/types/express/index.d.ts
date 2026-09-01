declare global {
	namespace Express {
		export interface Request {
			customProperty?: string;
		}
	}
}

export {};
