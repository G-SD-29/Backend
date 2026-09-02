import { z } from 'zod/v4';
import { isValidObjectId, Types } from 'mongoose';

export const blogPostInputSchema = z.strictObject({
  title: z.string({ error: 'Title must be string' }).min(1, { error: 'Title is required' }),
  content: z.string({ error: 'Content must be a string' }).min(1, { error: 'Content is required' }),
  userId: z
    .string()
    .refine(val => isValidObjectId(val), { error: 'Not a valid ObjectId' })
    .transform(val => new Types.ObjectId(val))
});

export const blogPostSchema = z.strictObject({
  _id: z.instanceof(Types.ObjectId),
  ...blogPostInputSchema.shape,
  createdAt: z.date(),
  updatedAt: z.date()
});
