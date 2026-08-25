import { MongoClient } from 'mongodb';

const client = new MongoClient(envOrThrow('MONGO_URI'));

try {
	client.connect();
} catch (err) {
	console.log('MongoDB connection error');
	process.exit(1);
}

export const db = (database: string) => client.db(database);

function envOrThrow(key: string) {
	if (!process.env[key]) throw new Error(`${key} is missing in .env file`);

	return process.env[key];
}
