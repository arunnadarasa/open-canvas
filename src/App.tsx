import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <PrivyProvider
    appId={import.meta.env.VITE_PRIVY_APP_ID || 'YOUR_PRIVY_APP_ID'}
    config={{
      loginMethods: ['wallet'],
      appearance: {
        theme: 'dark',
        accentColor: '#00dbde',
        walletChainType: 'solana-only', // Only show Solana wallets
        // Explicitly list Solana wallets - Phantom should be detected if installed
        walletList: [
          'phantom', // Explicitly include Phantom
          'detected_solana_wallets', // Show other detected browser extensions
          // Exclude QR code for cleaner UX on desktop
        ],
      },
      // Configure external Solana wallet connectors
      // Note: solana.rpcs is only needed for embedded wallets, not external ones like Phantom
      externalWallets: {
        solana: {
          connectors: toSolanaWalletConnectors(),
        },
      },
    }}
  >
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </PrivyProvider>
);

export default App;
