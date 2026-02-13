import { useState, useEffect, useRef, useCallback } from 'react';
import { Fingerprint, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface ClawKeyRegisterProps {
  walletAddress: string | null;
  onVerified: () => void;
  isVerified: boolean;
}

export default function ClawKeyRegister({ walletAddress, onVerified, isVerified }: ClawKeyRegisterProps) {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [registrationUrl, setRegistrationUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check existing verification status
  useEffect(() => {
    if (isVerified) {
      setChecking(false);
      return;
    }
    if (!walletAddress) {
      setChecking(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('clawkey_agents')
        .select('verified')
        .eq('wallet_address', walletAddress)
        .maybeSingle();
      if ((data as any)?.verified) {
        localStorage.setItem('clawkey_verified', 'true');
        onVerified();
      }
      setChecking(false);
    })();
  }, [walletAddress, isVerified, onVerified]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const pollStatus = useCallback((sid: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clawkey-status`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: sid }),
          }
        );
        const data = await res.json();
        if (data.status === 'completed') {
          localStorage.setItem('clawkey_verified', 'true');
          onVerified();
          setRegistrationUrl(null);
          setSessionId(null);
          stopPolling();
        } else if (data.status === 'failed' || data.status === 'expired') {
          setError(`Registration ${data.status}. Please try again.`);
          setRegistrationUrl(null);
          setSessionId(null);
          stopPolling();
        }
      } catch {
        // Silently retry on network errors
      }
    }, 3000);
  }, [stopPolling, onVerified]);

  const handleRegister = async () => {
    if (!walletAddress) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clawkey-register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet_address: walletAddress }),
        }
      );
      const data = await res.json();
      if (data.alreadyVerified) {
        localStorage.setItem('clawkey_verified', 'true');
        onVerified();
        return;
      }
      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }
      setSessionId(data.sessionId);
      setRegistrationUrl(data.registrationUrl);
      pollStatus(data.sessionId);
    } catch (e: any) {
      setError(e.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  if (checking) return null;

  // Show badge when verified
  if (isVerified) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium">
        <Fingerprint className="w-4 h-4" />
        ClawKey Verified
      </div>
    );
  }

  // Gate card (matching WorldIDVerify style)
  return (
    <div className="glass-strong rounded-2xl p-6 sm:p-8 lg:p-6 text-center lg:text-left space-y-5 lg:space-y-4">
      <div className="inline-flex items-center justify-center lg:justify-start w-16 h-16 lg:w-12 lg:h-12 rounded-2xl lg:rounded-xl bg-gradient-to-br from-[hsl(var(--gradient-cyan))] to-[hsl(var(--gradient-magenta))]">
        <Fingerprint className="w-8 h-8 lg:w-5 lg:h-5 text-white" />
      </div>
      <h3 className="text-xl lg:text-lg font-bold">Register Your Claw Agent</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto lg:mx-0">
        Prove human ownership of your AI agent via ClawKey's VeryAI palm verification before minting.
      </p>

      {registrationUrl ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Complete palm verification by clicking the link below:
          </p>
          <a
            href={registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[hsl(var(--gradient-cyan))] to-[hsl(var(--gradient-magenta))] hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.5)] transition-all duration-300"
          >
            <ExternalLink className="w-5 h-5" />
            Open VeryAI Verification
          </a>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            Waiting for verification to complete...
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleRegister}
            disabled={loading || !walletAddress}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[hsl(var(--gradient-cyan))] to-[hsl(var(--gradient-magenta))] hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.5)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 btn-shimmer bg-[length:200%_auto]"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <Fingerprint className="w-5 h-5" />
                Register Agent with ClawKey
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem('clawkey_verified', 'true');
              onVerified();
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
          >
            Skip for demo (hackathon judges)
          </button>
        </div>
      )}

      {!walletAddress && (
        <p className="text-xs text-muted-foreground">Connect your wallet first to register.</p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
