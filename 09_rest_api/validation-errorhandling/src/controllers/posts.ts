import { type RequestHandler } from 'express';
import { Post, User } from '#models';
import type { blogPostInputSchema, blogPostSchema } from '#schemas';
import { z } from 'zod/v4';

type BlogPostDTO = z.infer<typeof blogPostSchema>;
type BlogPostInputDTO = z.infer<typeof blogPostInputSchema>;

export const getPosts: RequestHandler<unknown, BlogPostDTO[]> = async (req, res) => {
  const posts = await Post.find().populate('userId', 'firstName lastName email').lean();

  res.json(posts);
};

export const createPost: RequestHandler<unknown, BlogPostDTO, BlogPostInputDTO> = async (req, res) => {
  const { title, content, userId } = req.body;

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found', { cause: 404 });

  const post = await Post.create<BlogPostInputDTO>({ title, content, userId });

  const populatedPost = await post.populate('userId', 'firstName lastName email');
  res.json(populatedPost);
};

export const getPostById: RequestHandler<{ id: string }> = async (req, res) => {
  const {
    params: { id }
  } = req;
  const post = await Post.findById(id).populate('userId', 'firstName lastName email');
  if (!post) throw new Error('Post not found', { cause: 404 });

  res.json(post);
};

export const updatePost: RequestHandler<{ id: string }, BlogPostDTO, BlogPostInputDTO> = async (req, res) => {
  const {
    body: { title, content, userId },
    params: { id }
  } = req;

  const post = await Post.findById(id);
  if (!post) throw new Error('Post not found', { cause: 404 });

  post.title = title;
  post.content = content;
  post.userId = userId;
  await post.save();

  const populatedPost = await post.populate('userId', 'firstName lastName email');
  res.json(populatedPost);
};

export const deletePost: RequestHandler<{ id: string }> = async (req, res) => {
  const {
    params: { id }
  } = req;
  const post = await Post.findByIdAndDelete(id);
  if (!post) throw new Error('Post not found', { cause: 404 });

  res.json({ message: 'Post deleted' });
};
