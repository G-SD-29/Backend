import type { ZodObject } from 'zod';
import { z } from 'zod/v4';
import type { Request, Response, NextFunction } from 'express';
import { blogPostInputSchema, userInputSchema } from '#schemas';

// export function validateBlogPost(req: Request, res: Response, next: NextFunction) {
//   const { data, error, success } = blogPostInputSchema.safeParse(req.body);

//   if (!success) {
//     next(new Error(z.prettifyError(error), { cause: 400 }));
//   } else {
//     req.body = data;
//     next();
//   }
// }

// export function validateUser(req: Request, res: Response, next: NextFunction) {
//   const { data, error, success } = userInputSchema.safeParse(req.body);

//   if (!success) {
//     next(new Error(z.prettifyError(error), { cause: 400 }));
//   } else {
//     req.body = data;
//     next();
//   }
// }

function validateBodyZod(zodSchema: ZodObject) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { data, error, success } = zodSchema.safeParse(req.body);

    if (!success) {
      next(new Error(z.prettifyError(error), { cause: 400 }));
    } else {
      req.body = data;
      next();
    }
  };
}

export default validateBodyZod;
