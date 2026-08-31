import http, { type RequestListener } from 'node:http';

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

function createResponse(
	res: http.ServerResponse,
	statusCode: number,
	message: unknown,
) {
	res.writeHead(statusCode, { 'content-type': 'application/json' });
	return res.end(
		typeof message === 'string'
			? JSON.stringify({ message })
			: JSON.stringify(message),
	);
}

const requestHandler: RequestListener = (req, res) => {
	const singlePostRegex = /^\/posts\/[0-9a-zA-Z]+$/; // Simple expression to match the pattern /posts/anything

	const { method, url } = req;

	if (url === '/posts') {
		if (method === 'GET') {
			return createResponse(res, 200, posts);
		}
		if (method === 'POST') {
			let body = '';

			req.on('data', (chunk) => {
				console.log(chunk);
				console.log(chunk.toString());
				body += chunk.toString();
			});

			req.on('end', () => {
				const newPost = {
					id: crypto.randomUUID(),
					...JSON.parse(body),
				};
				posts.push(newPost);
				createResponse(res, 201, newPost);
			});
			return;
		}

		return createResponse(res, 405, 'Method not Allowed');
	}

	if (singlePostRegex.test(url!)) {
		if (method === 'GET') {
            // posts filter
            // db query
			return createResponse(res, 200, `GET request on ${url}`);
		}
	}
};

const server = http.createServer(requestHandler);

const port = 3500;

server.listen(port, () =>
	console.log(`Server running at http://localhost:${port}`),
);
