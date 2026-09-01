import { type RequestHandler } from 'express';
import { Post } from '#models';

export const getPosts: RequestHandler = async (req, res) => {
	console.log(req.customProperty);
	const posts = await Post.find();
	res.json(posts);
};

export const createPost: RequestHandler = async (req, res) => {
	const { body } = req;
	if (!body.title || !body.content) {
		return res.json({ message: 'Invalid request body' });
	}

	const post = new Post(body);
	await post.save();
	return res.json(post);
};

export const getPostWithId: RequestHandler = async (req, res) => {
	const { id } = req.params;

	const post = await Post.findById(id);

	if (!post) return res.json({ message: 'Post not found' });

	res.json(post);
};

export const updatePost: RequestHandler = async (req, res) => {
	const { id } = req.params;
	const { body } = req;

	const post = await Post.findByIdAndUpdate(id, body, {
		returnDocument: 'after',
	});

	if (!post) return res.json({ message: 'Post not found' });

	res.json(post);
};

export const deletePost: RequestHandler = async (req, res) => {
	const { id } = req.params;

	const post = await Post.findByIdAndDelete(id);
	if (!post) return res.json({ message: 'Post not found' });

	res.json({ message: 'Post deleted' });
};
