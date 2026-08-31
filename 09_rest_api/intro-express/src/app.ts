import express, { type Request } from 'express';

const app = express();

const posts = [
	{
		id: '1',
		title: 'First post',
		content: 'Hello world!',
	},
	{
		id: '2',
		title: 'Second post',
		content: 'My second post!',
	},
];

type PostRequestBody = {
	title: string;
	content: string;
};

app.use(express.json());

app.get('/posts', (req, res) => {
	// communicate with db
	res.json({ posts });
});

app.post('/posts', (req: Request<{}, {}, PostRequestBody>, res) => {
	const newPost = {
		id: crypto.randomUUID(),
		title: req.body.title,
		content: req.body.content,
	};

	posts.push(newPost);
	res.send({ newPost });
});

app.get('/posts/:id', (req, res) =>
	res.json({ message: `GET post for id ${req.params.id}` }),
);

app.put('/posts/:id', (req, res) => res.json({ message: 'PUT Request' }));

app.delete('/posts/:id', (req, res) => res.json({ message: 'DELETE request' }));

const port = 8080;

app.listen(port, () =>
	console.log(`Server is running at http://localhost:${port}`),
);
