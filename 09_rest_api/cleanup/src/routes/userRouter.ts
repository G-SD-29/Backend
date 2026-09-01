import { Router } from 'express';
import { getUsers, createUser, getUserById, updateUser, deleteUser } from '#controllers';

const userRouter = Router();
userRouter.get('/users', getUsers);
userRouter.post('/users', createUser);
userRouter.get('/users/:id', getUserById);
userRouter.put('/users/:id', updateUser);
userRouter.delete('/users/:id', deleteUser);

export default userRouter;
