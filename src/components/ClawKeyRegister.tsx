import { useState, useEffect, useRef, useCallback } from 'react';
import { Fingerprint, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface ClawKeyRegisterProps {
  walletAddress: string | null;
}

export default function ClawKeyRegister({ walletAddress }: ClawKeyRegisterProps) {
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [registrationUrl, setRegistrationUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check existing verification status
  useEffect(() => {
    if (!walletAddress) {
      setChecking(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('clawkey_agents' as any)
        .select('verified')
        .eq('wallet_address', walletAddress)
        .maybeSingle();
      if ((data as any)?.verified) setVerified(true);
      setChecking(false);
    })();
  }, [walletAddress]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Cleanup on unmount
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
          setVerified(true);
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
  }, [stopPolling]);

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
        setVerified(true);
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
  if (!walletAddress) return null;

  if (verified) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium">
        <Fingerprint className="w-4 h-4" />
        ClawKey Verified
      </div>
    );
  }

  return (
    <div className="glass-strong rounded-2xl p-6 sm:p-8 mt-6 space-y-4">
      <div className="flex items-start gap-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--gradient-cyan))] to-[hsl(var(--gradient-magenta))] shrink-0">
          <Fingerprint className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold">Register Your Claw Agent</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Optionally prove human ownership of your AI agent via ClawKey's VeryAI palm verification. Verified agents earn a trust badge.
          </p>
        </div>
      </div>

      {registrationUrl ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Complete palm verification by clicking the link below:
          </p>
          <a
            href={registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-[hsl(var(--gradient-cyan))] to-[hsl(var(--gradient-magenta))] hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.5)] transition-all duration-300"
          >
            <ExternalLink className="w-4 h-4" />
            Open VeryAI Verification
          </a>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            Waiting for verification to complete...
          </div>
        </div>
      ) : (
        <Button
          onClick={handleRegister}
          disabled={loading}
          className="bg-gradient-to-r from-[hsl(var(--gradient-cyan))] to-[hsl(var(--gradient-magenta))] text-white hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.5)] transition-all duration-300 btn-shimmer bg-[length:200%_auto]"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Registering...
            </>
          ) : (
            <>
              <Fingerprint className="w-4 h-4" />
              Register Agent with ClawKey
            </>
          )}
        </Button>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
