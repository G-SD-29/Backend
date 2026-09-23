import { connectDB, disconnectDB } from '#db';
import { Book } from '#model';

const adjectives = ['Silent', 'Hidden', 'Last', 'Broken', 'Golden', 'Lost', 'Ancient', 'Forgotten', 'Distant', 'Crimson'];
const nouns = ['River', 'Kingdom', 'Shadow', 'Garden', 'Machine', 'Ocean', 'Mountain', 'Secret', 'Journey', 'Empire'];
const authors = [
	'Anna Weber', 'Lukas Meyer', 'Sofia Klein', 'Jonas Fischer', 'Mia Schulz',
	'Leon Wagner', 'Emma Becker', 'Noah Hoffmann', 'Lea Koch', 'Finn Richter',
];
const genrePool = ['Fiction', 'Fantasy', 'Sci-Fi', 'Mystery', 'Romance', 'Thriller', 'Biography', 'History'];

const books = Array.from({ length: 100 }, (_, i) => ({
	title: `The ${adjectives[i % adjectives.length]} ${nouns[(i * 3) % nouns.length]}`,
	author: authors[i % authors.length],
	genre: [genrePool[i % genrePool.length], genrePool[(i + 3) % genrePool.length]],
	pageCount: 100 + ((i * 37) % 500),
}));

await connectDB(process.env.MONGO_URI!);
await Book.insertMany(books);
console.log(`Inserted ${books.length} books`);
await disconnectDB();
