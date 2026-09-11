import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { db, client } from '../db.ts';

export const auth = betterAuth({
  database: mongodbAdapter(db, { client: client }),
  emailAndPassword: { enabled: true },
  baseURL: 'http://localhost:5173',
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60
    }
  },
  user: {
    fields: {
      name: 'firstName'
    },
    additionalFields: {
      lastName: {
        type: 'string'
      }
    }
  }
});
