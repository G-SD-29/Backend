import { type RequestHandler } from 'express';
import { User } from '#models';
import type { UserType } from '#types';

export const getUsers: RequestHandler = async (req, res) => {
  const users = await User.find();

  res.json(users);
};

export const createUser: RequestHandler = async (req, res) => {
  const { firstName, lastName, email, password, isActive } = req.body as UserType;

  if (!firstName || !lastName || !email || !password)
    throw new Error('firstName, lastName, email, password are required');

  const found = await User.findOne({ email });
  if (found) throw new Error('User already exists');

  const user = await User.create<UserType>({ firstName, lastName, email, password, isActive });

  res.json(user);
};

export const getUserById: RequestHandler = async (req, res) => {
  const {
    params: { id }
  } = req;
  const user = await User.findById(id);
  if (!user) throw new Error('User not found', { cause: 404 });

  res.json(user);
};

export const updateUser: RequestHandler = async (req, res) => {
  const {
    body,
    params: { id }
  } = req;
  const { firstName, lastName, email } = body as UserType;
  if (!firstName || !lastName || !email) throw new Error('firstName, lastName, email required');

  const user = await User.findById(id);
  if (!user) throw new Error('User not found', { cause: 404 });

  user.firstName = firstName;
  user.lastName = lastName;
  user.email = email;
  await user.save();

  res.json(user);
};

export const deleteUser: RequestHandler = async (req, res) => {
  const {
    params: { id }
  } = req;

  const user = await User.findByIdAndDelete(id);
  if (!user) throw new Error('User not found', { cause: 404 });

  res.json({ message: 'User deleted' });
};
