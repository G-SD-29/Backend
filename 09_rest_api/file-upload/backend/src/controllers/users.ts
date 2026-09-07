import type { RequestHandler } from 'express';
import { isValidObjectId, type Types } from 'mongoose';
import type { z } from 'zod/v4';
import { User } from '#models';
import type { userSchema } from '#schemas';

type UserInputDTO = z.input<typeof userSchema>;
type UserDTO = UserInputDTO & {
  _id: InstanceType<typeof Types.ObjectId>;
  createdAt: Date;
};
type IdParams = {
  id: string;
};

export const getUsers: RequestHandler<unknown, UserDTO[]> = async (req, res) => {
  const users = await User.find().lean();
  res.json(users);
};

export const createUser: RequestHandler<unknown, UserDTO, UserInputDTO> = async (req, res) => {
  const {
    body: { email }
  } = req;
  const found = await User.findOne({ email });

  if (found) throw new Error('Email already exists', { cause: { status: 400 } });

  const user = await User.create(req.body satisfies UserInputDTO);

  res.status(201).json(user);
};

export const getUserById: RequestHandler<IdParams, UserDTO> = async (req, res) => {
  const {
    params: { id }
  } = req;

  if (!isValidObjectId(id)) throw new Error('Invalid id', { cause: { status: 400 } });

  const user = await User.findById(id).lean();

  if (!user) throw new Error('User not found', { cause: { status: 404 } });

  res.json(user);
};

export const updateUser: RequestHandler<IdParams, UserDTO, UserInputDTO> = async (req, res) => {
  const {
    params: { id },
    body
  } = req;

  if (!isValidObjectId(id)) throw new Error('Invalid id', { cause: { status: 400 } });

  const user = await User.findByIdAndUpdate(id, body, { returnDocument: 'after' }).lean();

  if (!user) throw new Error('User not found', { cause: { status: 404 } });

  res.json(user);
};

export const deleteUser: RequestHandler<IdParams, { message: string }> = async (req, res) => {
  const {
    params: { id }
  } = req;

  if (!isValidObjectId(id)) throw new Error('Invalid id', { cause: { status: 400 } });

  const user = await User.findByIdAndDelete(id);

  if (!user) throw new Error('User not found', { cause: { status: 404 } });

  res.json({ message: 'User deleted' });
};
