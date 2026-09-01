import express from 'express';
import { postRoutes } from '#routes';
import '#db';
import { logger } from '#middlewares';

const app = express();
const port = 8000;

app.use(express.json());

app.use(express.static('./public'));

app.use(logger);
app.use('/posts', postRoutes);

app.listen(port, () => {
	`Server listening on port ${port}`;
});
