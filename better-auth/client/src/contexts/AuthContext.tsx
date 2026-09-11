import { createContext } from 'react';

type AuthContextType = {
	user: User | undefined;
	isPending: boolean;
};

export const AuthContext = createContext<AuthContextType | null>(null);
