import '#db';
import cors from 'cors';
import express from 'express';
import { errorHandler, notFoundHandler } from '#middlewares';
import { CLIENT_BASE_URL } from '#config';
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';
import { auth } from '#utils';

const app = express();
const port = process.env.PORT || '3000';

app.use(
  cors({
    origin: CLIENT_BASE_URL, // for use with credentials, origin(s) need to be specified
    credentials: true, // sends and receives secure cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  })
);

app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json());

app.use('*splat', notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Auth Server listening on port ${port}`);
});
