declare global {
	type Post = {
		_id: string;
		title: string;
		author: string;
		image: string;
		content: string;
	};

	type User = {
		id: string;
		createdAt: Date;
		updatedAt: Date;
		email: string;
		emailVerified: boolean;
		name: string;
		image?: string | null | undefined;
	};
}
