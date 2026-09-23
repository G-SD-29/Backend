import express from 'express';
import { booksRouter } from '#routes';
import { errorHandler } from '#middlewares';

export const app = express();

app.use(express.json());
app.use('/books', booksRouter);
app.use(errorHandler);
