import { ACCESS_JWT_SECRET } from '#config';
import jwt from 'jsonwebtoken';
import type { Types } from 'mongoose';
import crypto from 'node:crypto';
import RefreshToken from '../models/RefreshToken.ts';

type UserData = {
  _id: Types.ObjectId;
  roles: string[];
};

export const createToken = (userData: UserData) => {
  console.log(userData);
  const token = jwt.sign({ id: userData._id, roles: userData.roles }, ACCESS_JWT_SECRET, {
    expiresIn: '15min'
  });

  return token;
};

export async function createRefreshToken(id: Types.ObjectId) {
  const refreshTokenString = crypto.randomBytes(25).toString('hex');

  const insertedToken = await RefreshToken.create({ token: refreshTokenString, userId: id });
  console.log('inserted', insertedToken);
  return refreshTokenString;
}
