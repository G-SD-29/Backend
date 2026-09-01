import express, { type RequestHandler } from 'express';
import { postRouter, userRouter } from '#routes';

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

app.use('/users', userRouter);
app.use('/posts', postRouter);

app.listen(port, () => console.log(`\x1b[34mMain app listening at http://localhost:${port}\x1b[0m`));
