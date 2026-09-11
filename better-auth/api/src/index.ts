import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import '#db';
import { authenticate, errorHandler } from '#middlewares';
import { postsRouter } from '#routes';

const app = express();
const port = process.env.PORT || 8000;

app.use(
  cors({
    origin: process.env.CLIENT_BASE_URL,
    credentials: true,
    exposedHeaders: ['WWW-Authenticate']
  })
);
app.use(express.json(), cookieParser());
app.use('/posts', postsRouter);

app.get('/admin', authenticate, (req, res) => {
  res.json({ message: 'you can do admin things' });
});

app.use('/*splat', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});
app.use(errorHandler);

app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
