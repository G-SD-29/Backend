import { Router } from 'express';
import { getPosts, createPost, getPostById, updatePost, deletePost } from '#controllers';

const postRouter = Router();

postRouter.get('/posts', getPosts);
postRouter.post('/posts', createPost);
postRouter.get('/posts/:id', getPostById);
postRouter.put('/posts/:id', updatePost);
postRouter.delete('/posts/:id', deletePost);

export default postRouter;
