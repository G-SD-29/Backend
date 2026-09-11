import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { MongoClient } from 'mongodb';

export const client = new MongoClient(process.env.MONGO_URI!);

export const db = client.db();

export const auth = betterAuth({
  database: mongodbAdapter(db, { client: client }),
  emailAndPassword: { enabled: true },
  trustedOrigins: ['http://localhost:5173'],
  baseURL: 'http://localhost:5173'
});
