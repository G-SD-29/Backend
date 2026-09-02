import { Router } from 'express';
import { getUsers, createUser, getUserById, updateUser, deleteUser } from '#controllers';
import { validateBodyZod } from '#middlewares';
import { userInputSchema } from '#schemas';

const userRouter = Router();
userRouter.get('/', getUsers);
userRouter.post('/', validateBodyZod(userInputSchema), createUser);
userRouter.get('/:id', getUserById);
userRouter.put('/:id', validateBodyZod(userInputSchema), updateUser);
userRouter.delete('/:id', deleteUser);

export default userRouter;
