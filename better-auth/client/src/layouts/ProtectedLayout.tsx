import { Outlet, useNavigate } from 'react-router';
import useAuth from '@/contexts/useAuth';
import { useEffect } from 'react';

const ProtectedLayout = () => {
	const { user, isPending } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (isPending) return;
		if (!user) navigate('/login');
	}, [user, navigate, isPending]);

	if (isPending) return <p>Loading...</p>;
	if (!user) return null;
	return <Outlet />;
};

export default ProtectedLayout;
