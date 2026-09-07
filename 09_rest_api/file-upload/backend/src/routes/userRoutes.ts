import { Router } from 'express';
import { createUser, deleteUser, getUserById, getUsers, updateUser } from '#controllers';
import { validateBody, cloudUploader, fileHandler } from '#middleware';
import { userSchema } from '#schemas';

const userRoutes = Router();

userRoutes.route('/').get(getUsers).post(validateBody(userSchema), createUser);
userRoutes
  .route('/:id')
  .get(getUserById)
  .put(fileHandler, cloudUploader, validateBody(userSchema), updateUser)
  .delete(deleteUser);

export default userRoutes;
