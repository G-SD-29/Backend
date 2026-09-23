import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../app.ts';

const sampleBook = {
	title: 'Dune',
	author: 'Frank Herbert',
	genre: ['Science Fiction'],
	pageCount: 412,
};

describe('books API', () => {
	it('creates and fetches a book', async () => {
		const created = await request(app).post('/books').send(sampleBook);
		expect(created.status).toBe(201);
		expect(created.body.title).toBe('Dune');

		const fetched = await request(app).get(`/books/${created.body._id}`);
		expect(fetched.status).toBe(200);
		expect(fetched.body.author).toBe('Frank Herbert');
	});

	it('lists all books', async () => {
		await request(app).post('/books').send(sampleBook);
		const res = await request(app).get('/books');
		expect(res.status).toBe(200);
		expect(res.body).toHaveLength(1);
	});

	it('rejects invalid input on create', async () => {
		const res = await request(app).post('/books').send({ title: 'No author' });
		expect(res.status).toBe(400);
	});

	it('replaces a book with PUT', async () => {
		const created = await request(app).post('/books').send(sampleBook);
		const res = await request(app)
			.put(`/books/${created.body._id}`)
			.send({ title: 'Dune Messiah', author: 'Frank Herbert', genre: ['Sci-Fi'], pageCount: 300 });
		expect(res.status).toBe(200);
		expect(res.body.title).toBe('Dune Messiah');
	});

	it('rejects an incomplete PUT body', async () => {
		const created = await request(app).post('/books').send(sampleBook);
		const res = await request(app).put(`/books/${created.body._id}`).send({ title: 'Missing fields' });
		expect(res.status).toBe(400);
	});

	it('partially updates a book with PATCH', async () => {
		const created = await request(app).post('/books').send(sampleBook);
		const res = await request(app).patch(`/books/${created.body._id}`).send({ pageCount: 500 });
		expect(res.status).toBe(200);
		expect(res.body.pageCount).toBe(500);
		expect(res.body.title).toBe('Dune');
	});

	it('rejects an empty PATCH body', async () => {
		const created = await request(app).post('/books').send(sampleBook);
		const res = await request(app).patch(`/books/${created.body._id}`).send({});
		expect(res.status).toBe(400);
	});

	it('deletes a book', async () => {
		const created = await request(app).post('/books').send(sampleBook);
		const res = await request(app).delete(`/books/${created.body._id}`);
		expect(res.status).toBe(200);

		const fetchAfterDelete = await request(app).get(`/books/${created.body._id}`);
		expect(fetchAfterDelete.status).toBe(404);
	});

	it('returns 404 for a well-formed but missing id', async () => {
		const res = await request(app).get('/books/507f1f77bcf86cd799439011');
		expect(res.status).toBe(404);
	});

	it('returns 400 for a malformed id', async () => {
		const res = await request(app).get('/books/not-an-id');
		expect(res.status).toBe(400);
	});
});
