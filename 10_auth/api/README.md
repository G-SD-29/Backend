# WBS Travel Journal API

Starter code for authentication/authorization module at WBS Coding School

## Setup

- Fork repo
- Clone into your computer
- `cd` into working directory
- `npm i` to install dependencies
- create a `.env.development.local` file with variables:
  - `MONGO_URI` set to the same MongoDB connection string as the auth server.
  - `DB_NAME` ONLY in case you want to override the default `travel-journal` (must match `DB_NAME` for auth server)
  - `PORT` ONLY in case you want to override the default `8000`

## Commands

- `npm run dev`: Starts development server, pulling environment variables from `.env.development.local` file
- `npm start`: Builds and starts production server, pulling environment variables from `.env.production.local` file

## Usage

- The code is organised as follows:

```
wbs-ts-travel-journal-api/
|- config/ => To centralise and validate env variables
|- controllers/ => Our controller functions per resource
|- db/ => Database connection with Mongoose
|- middleware/ => custom middleware
|- models/ => Our models per resource
|- routes/ => Our routers per resource
|- schemas/=> Zod schemas for data validations
|- types/ => For additional types
\_ app.ts
```

## Setup checklist

- Run the development server
- Look through each file to get an overview of the application
- Test each of the endpoints
