import { Router } from 'express';
import { getBooks, getBookById, createBook, replaceBook, updateBook, deleteBook } from '#controllers';
import { validateBody } from '#middlewares';
import { bookInputSchema, bookPatchSchema } from '#schemas';

const booksRouter = Router();

booksRouter.get('/', getBooks);
booksRouter.get('/:id', getBookById);
booksRouter.post('/', validateBody(bookInputSchema), createBook);
booksRouter.put('/:id', validateBody(bookInputSchema), replaceBook);
booksRouter.patch('/:id', validateBody(bookPatchSchema), updateBook);
booksRouter.delete('/:id', deleteBook);

export default booksRouter;
