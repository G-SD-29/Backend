import type { RequestHandler } from 'express';
import { Book } from '#model';
import type { BookInput, BookPatchInput } from '#schemas';

export const getBooks: RequestHandler = async (req, res) => {
	const books = await Book.find();
	res.json(books);
};

export const getBookById: RequestHandler<{ id: string }> = async (req, res) => {
	const book = await Book.findById(req.params.id);
	if (!book) throw new Error('Book not found', { cause: 404 });
	res.json(book);
};

export const createBook: RequestHandler<unknown, unknown, BookInput> = async (req, res) => {
	const book = await Book.create(req.body);
	res.status(201).json(book);
};

export const replaceBook: RequestHandler<{ id: string }, unknown, BookInput> = async (req, res) => {
	const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
		returnDocument: 'after',
		overwrite: true,
		runValidators: true,
	});
	if (!book) throw new Error('Book not found', { cause: 404 });
	res.json(book);
};

export const updateBook: RequestHandler<{ id: string }, unknown, BookPatchInput> = async (req, res) => {
	const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
		returnDocument: 'after',
		runValidators: true,
	});
	if (!book) throw new Error('Book not found', { cause: 404 });
	res.json(book);
};

export const deleteBook: RequestHandler<{ id: string }> = async (req, res) => {
	const book = await Book.findByIdAndDelete(req.params.id);
	if (!book) throw new Error('Book not found', { cause: 404 });
	res.json({ message: 'Book deleted' });
};
