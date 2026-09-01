import { Router } from 'express';
import {
	getPosts,
	createPost,
	getPostWithId,
	updatePost,
	deletePost,
} from '#controllers';
import { logger } from '#middlewares';
import { validateId } from '#middlewares';

const postRoutes = Router();

// postRoutes.use(logger);

postRoutes.get('/', getPosts);
postRoutes.post('/', createPost);
postRoutes.get('/:id', validateId, getPostWithId);
postRoutes.put('/:id', validateId, updatePost);
postRoutes.delete('/:id', validateId, deletePost);

export default postRoutes;
