import { useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
import type { ReactNode } from 'react';
import { refresh, getMe } from '@/data';

const AuthContextProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);
	const [authLoading] = useState(false);

	useEffect(() => {
		const refreshLogin = async () => {
			try {
				await refresh();
				const user = await getMe();
				setUser(user);
			} catch (error) {
				console.log(error);
			}
		};
		refreshLogin();
	}, []);

	return (
		<AuthContext.Provider value={{ user, setUser, authLoading }}>
			{children}
		</AuthContext.Provider>
	);
};

export default AuthContextProvider;
