import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router';
import { toast } from 'react-toastify';
import type { DbPost } from '@/types';
import { getSinglePost } from '@/data';
import { PostSkeleton, EditModal, DeleteModal } from '@/components';

const Post = () => {
	const { id } = useParams<{ id: string }>();
	const [loading, setLoading] = useState(true);
	const [post, setPost] = useState<DbPost | null>(null);

	// useRef allows us to use reference DOM elements while keeping React in the loop
	// https://react.dev/reference/react/useRef#manipulating-the-dom-with-a-ref
	const editModalRef = useRef<HTMLDialogElement | null>(null);
	const deleteModalRef = useRef<HTMLDialogElement | null>(null);

	// so instead of document.querySelector('#modal-id').showModal(), we can use the ref
	const showEditModal = () => editModalRef.current?.showModal();
	const showDeleteModal = () => deleteModalRef.current?.showModal();

	useEffect(() => {
		(async () => {
			if (!id) return;
			try {
				const fetchedPost = await getSinglePost(id);
				setPost(fetchedPost);
			} catch (error: unknown) {
				const message = (error as { message: string }).message;
				toast.error(message);
			} finally {
				setLoading(false);
			}
		})();
	}, [id]);

	if (loading) return <PostSkeleton />;

	if (!post)
		return <div className='text-center text-xl mt-10'>Post not found.</div>;

	return (
		<>
			<h1 className='text-center text-4xl'>{post.title}</h1>
			<img
				src={post.image}
				alt={post.title}
				className='rounded-lg max-h-96 mx-auto'
			/>
			<div className='flex justify-center gap-6 my-4'>
				<button onClick={showEditModal} className='btn btn-success'>
					Edit
				</button>
				<EditModal
					editModalRef={editModalRef}
					_id={post._id}
					image={post.image}
					title={post.title}
					content={post.content}
					author={post.author}
					setPost={setPost}
				/>

				<button onClick={showDeleteModal} className='btn btn-error'>
					Delete
				</button>
				<DeleteModal deleteModalRef={deleteModalRef} _id={post._id} />
			</div>
			<p>{post.content}</p>
		</>
	);
};

export default Post;
