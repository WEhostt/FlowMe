import React, { createContext, useContext, ReactNode } from 'react';
import { WagmiProvider, createConfig, http, useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mainnet, sepolia } from 'wagmi/chains';
import { ConnectKitProvider, ConnectKitButton, getDefaultConfig } from "connectkit";

const queryClient = new QueryClient();

const config = createConfig(
  getDefaultConfig({
    chains: [mainnet, sepolia],
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(),
    },
    walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_WALLETCONNECT_PROJECT_ID',
    appName: "CryptoFlow",
    appDescription: "Modern Cryptocurrency Trading Platform",
  }),
);

interface AuthContextValue {
  address: `0x${string}` | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  disconnect: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthContextInner = ({ children }: { children: ReactNode }) => {
  const { address, isConnected } = useAccount();
  const { isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <AuthContext.Provider value={{ address, isConnected, isConnecting, disconnect }}>
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider theme="midnight">
          <AuthContextInner>
            {children}
          </AuthContextInner>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export { ConnectKitButton };
