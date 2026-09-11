const originalFetch = window.fetch;

const baseUrl = 'http://localhost:3000';

if (!baseUrl) {
	console.log('NO API URL provided');
}

window.fetch = async (url, options = {}, ...rest) => {
	const retry = options._retry;

	let res = await originalFetch(
		url,
		{ ...options, credentials: 'include' },
		...rest,
	);
	console.log(res);

	const authHeader = res.headers.get('www-authenticate');

	console.log('authHeader', authHeader);

	if (authHeader?.includes('token_expired') && !retry) {
		const refreshRes = await originalFetch(`${baseUrl}/auth/refresh`, {
			method: 'POST',
			credentials: 'include',
		});

		if (!refreshRes.ok) throw new Error('Refresh failed');

		res = await originalFetch(
			url,
			{ ...options, _retry: true, credentials: 'include' },
			...rest,
		);
	}

	return res;
};
