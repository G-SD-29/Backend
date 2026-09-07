import type { File } from 'formidable';

declare global {
  namespace Express {
    export interface Request {
      image?: File;
    }
  }
}

export {};
