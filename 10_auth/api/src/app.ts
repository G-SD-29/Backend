import cors from 'cors';
import express from 'express';
import '#db';
import { errorHandler, notFoundHandler } from '#middleware';
import { postRoutes, authRoutes } from '#routes';
import { PORT, CLIENT_BASE_URL } from '#config';
import cookieParser from 'cookie-parser';

const app = express();

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
    exposedHeaders: ['WWW-Authenticate']
  })
);
app.use(express.json());
app.use(cookieParser());

app.use('/posts', postRoutes);
app.use('/auth', authRoutes);

app.use('*splat', notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => console.log(`API Server listening on http://localhost:${PORT}`));
