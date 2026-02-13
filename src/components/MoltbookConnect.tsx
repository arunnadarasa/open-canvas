import { useState, useEffect } from 'react';
import { Users, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MoltbookConnectProps {
  walletAddress: string | null;
  isVerified?: boolean;
  onRegistered?: () => void;
}

export default function MoltbookConnect({ walletAddress, isVerified, onRegistered }: MoltbookConnectProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agentName, setAgentName] = useState('');
  const [claimUrl, setClaimUrl] = useState('');
  const [registered, setRegistered] = useState(false);
  const [fetchingStatus, setFetchingStatus] = useState(!!isVerified);
  const [justRegistered, setJustRegistered] = useState(false);

  // Check localStorage for claimed state
  useEffect(() => {
    if (walletAddress && localStorage.getItem(`moltbook_claimed_${walletAddress}`)) {
      setJustRegistered(false);
    }
  }, [walletAddress]);

  // Fetch registration status when in badge mode
  useEffect(() => {
    if (!isVerified) return;
    if (!walletAddress) {
      setFetchingStatus(false);
      return;
    }
    setFetchingStatus(true);
    supabase
      .from('moltbook_agents_public' as any)
      .select('agent_name, claim_url')
      .eq('wallet_address', walletAddress)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setAgentName((data as any).agent_name || '');
          setClaimUrl((data as any).claim_url || '');
          setRegistered(true);
        }
        setFetchingStatus(false);
      });
  }, [isVerified, walletAddress]);

  // Loading state
  if (fetchingStatus) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass text-xs font-medium text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Loading…
      </span>
    );
  }

  // Badge mode: registered agent found
  if (isVerified && registered && !justRegistered) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass text-xs font-medium text-primary">
        <Users className="w-3.5 h-3.5" />
        Moltbook Agent
        {agentName && (
          <a
            href={`https://www.moltbook.com/u/${agentName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </span>
    );
  }

  // Just-registered confirmation with claim URL
  if (justRegistered && claimUrl) {
    return (
      <div className="glass-strong rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--gradient-cyan))] to-[hsl(var(--gradient-magenta))] flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Moltbook Agent Registered</h3>
            <p className="text-xs text-muted-foreground font-mono">{agentName}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Visit Moltbook to claim your agent and manage your API key. Your minted moves will be posted to the{' '}
          <a href="https://www.moltbook.com/m/dancetech" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
            dancetech
          </a>{' '}
          submolt.
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={claimUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Claim on Moltbook
          </a>
          <a
            href="https://www.moltbook.com/m/dancetech"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-white/10 hover:bg-white/5 transition-colors"
          >
            View dancetech
          </a>
          <button
            onClick={() => {
              if (walletAddress) localStorage.setItem(`moltbook_claimed_${walletAddress}`, 'true');
              setJustRegistered(false);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            I've Claimed It ✓
          </button>
        </div>
      </div>
    );
  }

  // Registration card
  const handleRegister = async () => {
    if (!walletAddress) return;
    setLoading(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('moltbook-register', {
        body: { wallet_address: walletAddress },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      setAgentName(data.agent_name);
      setClaimUrl(data.claim_url);
      setRegistered(true);
      const alreadyClaimed = walletAddress && localStorage.getItem(`moltbook_claimed_${walletAddress}`);
      setJustRegistered(!alreadyClaimed);
      onRegistered?.();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-strong rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--gradient-cyan))] to-[hsl(var(--gradient-magenta))] flex items-center justify-center">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Join Moltbook</h3>
          <p className="text-xs text-muted-foreground">Optional — post your mints to the dancetech social feed</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Register as a Moltbook agent to automatically share your minted moves on{' '}
        <a href="https://www.moltbook.com/m/dancetech" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
          moltbook.com/m/dancetech
        </a>
        . Manage your API key on Moltbook's dashboard.
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <button
        onClick={handleRegister}
        disabled={loading || !walletAddress}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-[hsl(var(--gradient-cyan))] to-[hsl(var(--gradient-magenta))] hover:shadow-[0_0_20px_-5px_hsl(var(--primary)/0.4)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 btn-shimmer bg-[length:200%_auto]"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
        {loading ? 'Registering...' : 'Join Moltbook'}
      </button>
    </div>
  );
}
