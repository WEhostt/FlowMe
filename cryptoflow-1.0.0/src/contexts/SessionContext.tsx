import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import { getUser, getUserBalances } from '@/lib/firestore';
import type { UserBalances } from '@/lib/firestore';

export interface SessionUser {
  uid: string;
  name: string;
  email: string;
  balances: UserBalances;
}

interface SessionContextValue {
  isLoggedIn: boolean;
  user: SessionUser | null;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
};

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        try {
          const fullUser = await getUser(authUser.uid);
          if (fullUser) {
            const balances = await getUserBalances(authUser.uid);
            setUser({ 
              uid: fullUser.uid, 
              name: fullUser.name, 
              email: fullUser.email,
              balances 
            });
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    await auth.signOut();
  };

  return (
    <SessionContext.Provider value={{ 
      isLoggedIn: !!user, 
      user, 
      logout, 
      isLoading 
    }}>
      {children}
    </SessionContext.Provider>
  );
};
