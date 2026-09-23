import { app } from './app.ts';
import { connectDB } from '#db';
import { envOrThrow } from '#utils';

const port = process.env.PORT ?? 8000;

await connectDB(envOrThrow('MONGO_URI'));

app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});
