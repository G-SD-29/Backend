import { auth } from '#utils';
import { fromNodeHeaders } from 'better-auth/node';
import type { NextFunction, Request, Response } from 'express';

async function authenticate(req: Request, res: Response, next: NextFunction) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers)
  });

  if (!session) throw new Error('Not authenticated', { cause: { status: 400 } });

  req.user = session.user;
  next();
}

export default authenticate;
