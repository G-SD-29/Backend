import Joi from 'joi';

export interface BookInput {
	title: string;
	author: string;
	genre: string[];
	pageCount: number;
}

export type BookPatchInput = Partial<BookInput>;

export const bookInputSchema = Joi.object<BookInput>({
	title: Joi.string().min(1).required(),
	author: Joi.string().min(1).required(),
	genre: Joi.array().items(Joi.string()).min(1).required(),
	pageCount: Joi.number().integer().min(1).required(),
});

export const bookPatchSchema = bookInputSchema
	.fork(['title', 'author', 'genre', 'pageCount'], field => field.optional())
	.min(1);
