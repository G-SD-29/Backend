import { z } from 'zod';

const envSchema = z.object({
	VITE_APP_TRAVEL_JOURNAL_API_URL: z.url().default('http://localhost:8000'),
});

const parsedEnv = envSchema.safeParse(import.meta.env);

if (!parsedEnv.success) {
	console.error(
		'❌ Invalid environment variables:\n',
		z.prettifyError(parsedEnv.error),
	);
	process.exit(1);
}

export const { VITE_APP_TRAVEL_JOURNAL_API_URL } = parsedEnv.data;
