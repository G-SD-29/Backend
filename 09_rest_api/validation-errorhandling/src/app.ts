import express from 'express';
import '#db';
import { postRouter, userRouter } from '#routes';
import { errorHandler } from '#middlewares';

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

app.use('/users', userRouter);
app.use('/posts', postRouter);

app.use('*splat', (req, res, next) => {
  next(new Error('Not found', { cause: 404 }));
});

app.use(errorHandler);

app.listen(port, () => console.log(`\x1b[34mMain app listening at http://localhost:${port}\x1b[0m`));
