import type { DbPost, PostInput } from '../types/index';
import { VITE_APP_TRAVEL_JOURNAL_API_URL } from '../config/index';

const baseURL = `${VITE_APP_TRAVEL_JOURNAL_API_URL}/posts`;

export const getPosts = async (): Promise<DbPost[]> => {
	const res = await fetch(baseURL);
	if (!res.ok) {
		const errorData = await res.json();
		throw new Error(
			errorData?.error ?? 'An error occurred while fetching the posts',
		);
	}
	const data: DbPost[] = await res.json();
	return data;
};

export const getSinglePost = async (id: string): Promise<DbPost> => {
	const res = await fetch(`${baseURL}/${id}`);
	if (!res.ok) {
		const errorData = await res.json();
		throw new Error(
			errorData?.error ?? 'An error occurred while fetching the post',
		);
	}
	const data: DbPost = await res.json();
	return data;
};

export const createPost = async (formData: PostInput): Promise<DbPost> => {
	const res = await fetch(baseURL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(formData),
	});
	if (!res.ok) {
		const errorData = await res.json();
		throw new Error(
			errorData?.error ?? 'An error occurred creating the post',
		);
	}
	const data: DbPost = await res.json();
	return data;
};
export const updatePost = async (
	id: string,
	formData: PostInput,
): Promise<DbPost> => {
	const res = await fetch(`${baseURL}/${id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(formData),
	});
	if (!res.ok) {
		const errorData = await res.json();
		throw new Error(
			errorData?.error ?? 'An error occurred updating the post',
		);
	}
	const data: DbPost = await res.json();
	return data;
};
export const deletePost = async (id: string): Promise<{ message: string }> => {
	const res = await fetch(`${baseURL}/${id}`, {
		method: 'DELETE',
	});
	if (!res.ok) {
		const errorData = await res.json();
		throw new Error(
			errorData?.error ?? 'An error occurred deleting the post',
		);
	}
	const data: { message: string } = await res.json();
	return data;
};
