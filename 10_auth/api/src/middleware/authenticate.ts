import { ACCESS_JWT_SECRET } from '#config';
import type { RequestHandler } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';

const authenticate: RequestHandler = (req, res, next) => {
  const { accessToken } = req.cookies;

  if (!accessToken) {
    throw new Error('Not authorized', { cause: { status: 401 } });
  }

  try {
    const decoded = jwt.verify(accessToken, ACCESS_JWT_SECRET) as JwtPayload;

    req.user = {
      id: decoded.id,
      roles: decoded.roles
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new Error('Expired access token', { cause: { status: 401 }, code: 'ACCESS_TOKEN_EXPIRED' }));
    }

    throw new Error('Not authorized', { cause: { status: 401 } });
  }

  next();
};

export default authenticate;
