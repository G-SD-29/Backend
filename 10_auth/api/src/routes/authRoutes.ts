import { Router } from 'express';
import { login, logout, me, refresh, register } from '#controllers';
import { authenticate, validateBody } from '#middleware';
import { loginSchema, registerSchema } from '#schemas'; // TODO: use the schemas for validation

const authRoutes = Router();

authRoutes.post(
  '/register',
  (req, res, next) => {
    console.log(req.body);
    next();
  },
  validateBody(registerSchema),
  register
);

authRoutes.post('/login', validateBody(loginSchema), login);

authRoutes.post('/refresh', refresh);

authRoutes.delete('/logout', logout);

authRoutes.get('/me', authenticate, me);

export default authRoutes;
