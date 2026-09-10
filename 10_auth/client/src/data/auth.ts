import { VITE_APP_TRAVEL_JOURNAL_API_URL } from '@/config';

const baseURL: string = `${VITE_APP_TRAVEL_JOURNAL_API_URL}/auth`;

export async function register(
	body: User & { password: string; confirmPassword: string },
) {
	const { firstName, lastName, email, password, confirmPassword } = body;

	const res = await fetch(`${baseURL}/register`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},

		body: JSON.stringify({
			firstName,
			lastName,
			email,
			password,
			confirmPassword,
		}),
		credentials: 'include',
	});

	if (!res.ok) throw new Error('Registration failed');
	const data = await res.json();
	return data;
}

export async function login(body: { email: string; password: string }) {
	const { email, password } = body;
	const res = await fetch(`${baseURL}/login`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ email, password }),
		credentials: 'include',
	});
	if (!res.ok) throw new Error('Login failed');
	const data = await res.json();
	return data;
}

export async function logout() {
	const res = await fetch(`${baseURL}/logout`, {
		method: 'DELETE',
		credentials: 'include',
	});

	if (!res.ok) throw new Error('Logout failed');
}

export async function getMe() {
	const userResponse = await fetch(`${baseURL}/me`, {
		credentials: 'include',
	});

	if (!userResponse.ok) throw new Error('Refresh login failed');
	return userResponse.json();
}

export async function refresh() {
	const refreshResponse = await fetch(`${baseURL}/refresh`, {
		method: 'POST',
		credentials: 'include',
	});

	if (!refreshResponse.ok) return;
}
