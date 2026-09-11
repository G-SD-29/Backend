import type { RequestHandler } from 'express';
import { ACCESS_JWT_SECRET, REFRESH_TOKEN_TTL, SALT_ROUNDS } from '#config';
import User from '../models/User.ts';
import bcrypt from 'bcrypt';
import { createRefreshToken, createToken } from '../utils/index.ts';
import RefreshToken from '../models/RefreshToken.ts';

export const register: RequestHandler = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  const userExists = await User.exists({ email });

  if (userExists) {
    throw new Error('User already exists', { cause: { status: 409 } });
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const newUser = await User.create({
    ...req.body,
    password: hashedPassword
  });

  const { password: _, ...data } = newUser.toObject();

  const accessToken = createToken(data);
  const refreshToken = await createRefreshToken(newUser._id);

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none' as const
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_TTL * 100
  });

  res.json({ user: data });
};

export const login: RequestHandler = async (req, res) => {
  const { password, email } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new Error('Invalid Credentials', { cause: { status: 401 } });
  }

  const match = bcrypt.compare(password, user.password);

  if (!match) {
    throw new Error('Invalid credentials', { cause: { status: 401 } });
  }

  const { password: _, ...data } = user.toObject();

  const accessToken = createToken(data);
  const refreshToken = await createRefreshToken(user._id);

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none' as const
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_TTL * 100
  });

  res.json({ user: data });
};

export const refresh: RequestHandler = async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    throw new Error('Refresh token is required', { cause: { status: 401 } });
  }

  const storedToken = await RefreshToken.findOne({ token: refreshToken });

  if (!storedToken) {
    throw new Error('Refresh token not found', { cause: { status: 401 } });
  }

  const user = await User.findById(storedToken.userId);
  if (!user) throw new Error('User not found', { cause: { status: 404 } });

  const { password: _, ...data } = user.toObject();

  const accessToken = createToken(data);
  const newRefreshToken = await createRefreshToken(user._id);

  console.log('stored', storedToken);
  const deleted = await RefreshToken.findByIdAndDelete(storedToken._id);
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none' as const
  });

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_TTL * 1000
  });

  res.status(200).json({ message: 'Refreshed' });
};

export const logout: RequestHandler = async (req, res) => {
  const { refreshToken } = req.cookies;

  if (refreshToken) {
    await RefreshToken.findOneAndDelete({ token: refreshToken });
  }

  res.clearCookie('refreshToken');
  res.clearCookie('accessToken');
  res.json({ message: 'Logged out' });
};

export const me: RequestHandler = async (req, res, next) => {
  res.json({ user: req.user });
};
