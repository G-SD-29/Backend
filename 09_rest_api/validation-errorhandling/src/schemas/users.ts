import { z } from 'zod/v4';
import { Types } from 'mongoose';

export const userInputSchema = z.strictObject({
  firstName: z
    .string({ error: 'firstName must be a string' })
    .min(2, { error: 'firstName is required and must be at least 2 characters long' }),
  lastName: z
    .string({ error: 'lastName must be a string' })
    .min(1, { error: 'lastName must be at least 1 character long' }),
  email: z.email({ error: 'email must be a valid email address' }),
  password: z.string().min(8, { error: 'Password must contain at least 8 characters' }),
  isActive: z.boolean()
});

export const userSchema = z.strictObject({
  _id: z.instanceof(Types.ObjectId),
  ...userInputSchema.shape,
  createdAt: z.date(),
  updatedAt: z.date()
});
