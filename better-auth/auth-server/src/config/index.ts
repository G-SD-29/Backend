import { z } from 'zod/v4';

const envSchema = z.object({
  MONGO_URI: z.url({ protocol: /mongodb/ }),

  CLIENT_BASE_URL: z.url().default('http://localhost:5173'),
  BETTER_AUTH_SECRET: z.string()
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:\n', z.prettifyError(parsedEnv.error));
  process.exit(1);
}

export const { CLIENT_BASE_URL, MONGO_URI, BETTER_AUTH_SECRET } = parsedEnv.data;
