import { Router } from 'express';
import { validateZod } from '#middlewares';
import { createPost, deletePost, getAllPosts, getSinglePost, updatePost } from '#controllers';
import { postSchema } from '#schemas';
import { authenticate } from '#middlewares';

const postsRouter = Router();

postsRouter.route('/').get(getAllPosts).post(authenticate, validateZod(postSchema), createPost);

postsRouter.route('/:id').get(getSinglePost).put(validateZod(postSchema), authenticate, updatePost).delete(deletePost);

export default postsRouter;
