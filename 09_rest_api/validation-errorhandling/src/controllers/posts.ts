import { type RequestHandler } from 'express';
import { Post } from '#models';
import { type PostType } from '#types';

export const getPosts: RequestHandler = async (req, res) => {
  const posts = await Post.find().populate('userId', 'firstName lastName email').lean();

  res.json(posts);
};

export const createPost: RequestHandler = async (req, res) => {
  const { title, content, userId } = req.body as PostType;
  if (!title || !content || !userId) throw new Error('title, content and userId are required', { cause: 400 });

  const post = await Post.create<PostType>({ title, content, userId });

  const populatedPost = await post.populate('userId', 'firstName lastName email');
  res.json(populatedPost);
};

export const getPostById: RequestHandler = async (req, res) => {
  const {
    params: { id }
  } = req;
  const post = await Post.findById(id).populate('userId', 'firstName lastName email');
  if (!post) throw new Error('Post not found', { cause: 404 });

  res.json(post);
};

export const updatePost: RequestHandler = async (req, res) => {
  const {
    body: { title, content, userId },
    params: { id }
  } = req;

  if (!title || !content || !userId) throw new Error('title, content and userId are required', { cause: 400 });

  const post = await Post.findById(id);
  if (!post) throw new Error('Post not found', { cause: 404 });

  post.title = title;
  post.content = content;
  post.userId = userId;
  await post.save();

  const populatedPost = await post.populate('userId', 'firstName lastName email');
  res.json(populatedPost);
};

export const deletePost: RequestHandler = async (req, res) => {
  const {
    params: { id }
  } = req;
  const post = await Post.findByIdAndDelete(id);
  if (!post) throw new Error('Post not found', { cause: 404 });

  res.json({ message: 'Post deleted' });
};
