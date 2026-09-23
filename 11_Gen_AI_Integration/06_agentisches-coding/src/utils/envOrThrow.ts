export function envOrThrow(key: string): string {
	const value = process.env[key];
	if (!value) throw new Error(`${key} is missing in .env file`);
	return value;
}
