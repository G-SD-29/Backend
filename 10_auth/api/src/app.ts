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
    origin: CLIENT_BASE_URL, // for use with credentials, origin(s) need to be specified
    credentials: true, // sends and receives secure cookies
    exposedHeaders: ['WWW-Authenticate'] // needed to send the 'refresh trigger''
  })
);
app.use(express.json());
app.use(cookieParser());

app.use('/posts', postRoutes);
app.use('/auth', authRoutes);

app.use('*splat', notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => console.log(`API Server listening on http://localhost:${PORT}`));
