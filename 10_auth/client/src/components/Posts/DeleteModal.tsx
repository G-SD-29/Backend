import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';

import { deletePost } from '@/data';
import type { ModalRef } from '@/types';

type DeleteModalProps = {
	deleteModalRef: ModalRef;
	_id: string;
};

const DeleteModal = ({ deleteModalRef, _id }: DeleteModalProps) => {
	const [value, setValue] = useState('');
	const [isValid, setIsValid] = useState(false);
	const navigate = useNavigate();

	const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		try {
			await deletePost(_id);
		} catch (error) {
			const message = (error as { message: string }).message;
			toast.error(message);
		} finally {
			setValue('');
			deleteModalRef.current?.close();
			navigate('/');
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setValue(e.target.value);
		if (e.target.value === 'DELETE') {
			setIsValid(true);
		} else {
			setIsValid(false);
		}
	};
	return (
		<dialog ref={deleteModalRef} className='modal'>
			<div className='modal-box'>
				<form method='dialog'>
					{/* if there is a button in form, it will close the modal */}
					<button className='btn btn-sm btn-circle btn-ghost absolute right-2 top-2'>
						✕
					</button>
				</form>
				<h3 className='font-bold text-lg'>
					Are you sure you want to delete? This action is permanent
				</h3>
				<form
					onSubmit={handleSubmit}
					className='flex flex-col items-center mt-2'
				>
					<label className='form-control w-full max-w-xs'>
						<input
							type='text'
							placeholder='Type here'
							className={`input input-bordered w-full max-w-xs ${
								isValid ? '' : 'input-error'
							}`}
							value={value}
							onChange={handleChange}
						/>
						<div className='label'>
							<span className='label-text-alt'>Type DELETE to confirm</span>
						</div>
					</label>
					<button
						disabled={!isValid || value === ''}
						className='btn btn-error self-end'
					>
						Delete
					</button>
				</form>
			</div>
		</dialog>
	);
};

export default DeleteModal;
