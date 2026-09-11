import type { ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import { authClient } from '@/data/auth';

const AuthContextProvider = ({ children }: { children: ReactNode }) => {
	const { data, isPending } = authClient.useSession();
	return (
		<AuthContext.Provider value={{ user: data?.user, isPending }}>
			{children}
		</AuthContext.Provider>
	);
};

export default AuthContextProvider;
