import { ACCESS_JWT_SECRET } from '#config';
import jwt from 'jsonwebtoken';
import type { Types } from 'mongoose';

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
