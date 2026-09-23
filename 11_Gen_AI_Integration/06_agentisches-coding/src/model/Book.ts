import { Schema, model, type InferSchemaType } from 'mongoose';

const bookSchema = new Schema(
	{
		title: { type: String, required: true },
		author: { type: String, required: true },
		genre: { type: [String], required: true },
		pageCount: { type: Number, required: true, min: 1 },
	},
	{ timestamps: true },
);

export type BookDocument = InferSchemaType<typeof bookSchema>;

export default model('Book', bookSchema);
