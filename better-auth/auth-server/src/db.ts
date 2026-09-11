import { MONGO_URI } from '#config';
import { MongoClient } from 'mongodb';

export const client = new MongoClient(MONGO_URI);

export const db = client.db();
