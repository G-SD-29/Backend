import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import type { DbPost } from '@/types';
import { getPosts } from '@/data';
import { PostCard, PostsSkeleton } from '@/components';

const Home = () => {
	const [loading, setLoading] = useState(true);
	const [posts, setPosts] = useState<DbPost[]>([]);

	useEffect(() => {
		(async () => {
			try {
				const fetchedPosts: DbPost[] = await getPosts();
				setPosts(fetchedPosts);
			} catch (error: unknown) {
				const message = (error as { message: string }).message;
				toast.error(message);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	if (loading) return <PostsSkeleton />;
	return (
		<div className='grid grid-cols-1 lg:grid-cols-4 gap-4 '>
			{posts.map((post) => (
				<PostCard
					key={post._id}
					_id={post._id}
					content={post.content}
					image={post.image}
					title={post.title}
				/>
			))}
		</div>
	);
};

export default Home;
