declare global {
  namespace Express {
    export interface Request {
      file?: unknown;
    }
  }
}
export {};
