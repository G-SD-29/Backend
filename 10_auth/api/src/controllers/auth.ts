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

  // TODO: Implement user registration
  // Query the DB for an existing user with that email
  // Throw an error if a user with that email if found
  // Salt and hash the user's password
  // Save the user to the database with the hashed password
  // Generate access token (JWT) and refresh token (random string saved to database)
  // Send the access token (in the response body) and the refresh token (in a cookie)
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
  // TODO: Implement user login
  //   Query the DB for an existing user with that email (make sure to .select('+password') so we can compare it to the hashed password)
  // Throw an error is a user with that email is NOT found
  // Compare the hashed password to the password the user provided
  // Throw an error if the passwords don't match
  // Delete all refresh tokens from that user
  // Generate access token (JWT) and refresh token (random string saved to database)
  // Send the access token (in the response body) and the refresh token (in a cookie)
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

  await RefreshToken.findByIdAndDelete(storedToken._id);

  const user = await User.findById(storedToken.userId);
  if (!user) throw new Error('User not found', { cause: { status: 404 } });

  const { password: _, ...data } = user.toObject();

  const accessToken = createToken(data);
  const newRefreshToken = await createRefreshToken(user._id);

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none' as const
  });

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_TTL * 100
  });

  res.status(200).json({ message: 'Refreshed' });
  // TODO: Implement access token refresh and refresh token rotation
  // Destructure the refreshToken from req.cookies
  // Throw an error if there is no refreshToken cookie
  // Query the database for the matching stored refresh token
  // Throw an error if no stored token was found
  // Delete the stored token (since we'll be rotating it with a new refresh token)
  // Query the database for the user associated with that token
  // Throw an error if no user is found
  // Generate access token (JWT) and refresh token (random string saved to database)
  // Send the access token (in the response body) and the refresh token (in a cookie)
};

export const logout: RequestHandler = async (req, res) => {
  const { refreshToken } = req.cookies;

  if (refreshToken) {
    await RefreshToken.findOneAndDelete({ token: refreshToken });
  }

  res.clearCookie('refreshToken');
  res.clearCookie('accessToken');
  res.json({ message: 'Logged out' });
  // TODO: Implement logout by removing the tokens
  //   Get the refreshToken cookie
  // If a refreshToken cookie is found, delete the corresponding stored token from the database
  // Clear the refreshToken cookie
  // Send a success message in the response body
};

export const me: RequestHandler = async (req, res, next) => {
  // TODO: Implement a me handler
  // Get the access token from the request headers
  // Get the Authorization header from the request
  // Isolate the access token
  // Throw an error if there is not access token
  // Verify the access token
  // If token is expired, add code: ACCESS_TOKEN_EXPIRED to error
  // Query the database for the user who is the sub of the access token
  // Throw an error if no user is found
  // Send user profile with success message in response body
  res.json({ message: 'GET /me' });
};
