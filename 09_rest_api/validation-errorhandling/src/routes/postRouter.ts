import { Router } from 'express';
import { getPosts, createPost, getPostById, updatePost, deletePost } from '#controllers';
import { validateBodyZod } from '#middlewares';
import { blogPostInputSchema } from '#schemas';

const postRouter = Router();

postRouter.get('/', getPosts);
postRouter.post('/', validateBodyZod(blogPostInputSchema), createPost);
postRouter.get('/:id', getPostById);
postRouter.put('/:id', validateBodyZod(blogPostInputSchema), updatePost);
postRouter.delete('/:id', deletePost);

export default postRouter;
