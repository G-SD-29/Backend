import useAuth from '@/contexts/useAuth';
import { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router';

const ProtectedLayout = () => {
	const { user } = useAuth();

	const navigate = useNavigate();

	useEffect(() => {
		if (!user) navigate('/login');
	}, [user, navigate]);

	if (!user) return null;

	return <Outlet />;
};

export default ProtectedLayout;
