import { Router } from 'express';
import { validateBody } from '#middleware';
import { createPost, deletePost, getAllPosts, getSinglePost, updatePost } from '#controllers';
import { postSchema } from '#schemas';

const postRoutes = Router();

postRoutes.route('/').get(getAllPosts).post(validateBody(postSchema), createPost);

postRoutes.route('/:id').get(getSinglePost).put(validateBody(postSchema), updatePost).delete(deletePost);

export default postRoutes;
