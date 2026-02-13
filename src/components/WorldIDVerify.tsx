import { IDKitWidget, VerificationLevel, ISuccessResult } from '@worldcoin/idkit';
import { ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';

const APP_ID = 'app_0abc6adff26c25102bd04dc58f5a66a8';
const ACTION = 'moveregistry';

interface WorldIDVerifyProps {
  onVerified: () => void;
  isVerified: boolean;
}

export default function WorldIDVerify({ onVerified, isVerified }: WorldIDVerifyProps) {
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (proof: ISuccessResult) => {
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-worldid`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merkle_root: proof.merkle_root,
            nullifier_hash: proof.nullifier_hash,
            proof: proof.proof,
            verification_level: proof.verification_level,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('worldid_verified', 'true');
        onVerified();
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (e: any) {
      setError(e.message || 'Network error');
    } finally {
      setVerifying(false);
    }
  };

  if (isVerified) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium">
        <CheckCircle2 className="w-4 h-4" />
        Human Verified
      </div>
    );
  }

  return (
    <div className="glass-strong rounded-2xl p-6 sm:p-8 lg:p-6 text-center lg:text-left space-y-5 lg:space-y-4">
      <div className="inline-flex items-center justify-center lg:justify-start w-16 h-16 lg:w-12 lg:h-12 rounded-2xl lg:rounded-xl bg-gradient-to-br from-[hsl(var(--gradient-cyan))] to-[hsl(var(--gradient-magenta))]">
        <ShieldCheck className="w-8 h-8 lg:w-5 lg:h-5 text-white" />
      </div>
      <h3 className="text-xl lg:text-lg font-bold">Verify You're Human</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto lg:mx-0">
        Prove your personhood with World ID before connecting your wallet and minting moves.
      </p>

      {verifying ? (
        <div className="flex items-center justify-center gap-2 text-primary">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Verifying...</span>
        </div>
      ) : (
        <IDKitWidget
          app_id={APP_ID}
          action={ACTION}
          verification_level={VerificationLevel.Orb}
          handleVerify={handleVerify}
          onSuccess={() => {}}
        >
          {({ open }) => (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={open}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[hsl(var(--gradient-cyan))] to-[hsl(var(--gradient-magenta))] hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.5)] transition-all duration-300 btn-shimmer bg-[length:200%_auto]"
              >
                <ShieldCheck className="w-5 h-5" />
                Verify with World ID
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('worldid_verified', 'true');
                  onVerified();
                }}
                className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
              >
                Skip for demo (hackathon judges)
              </button>
            </div>
          )}
        </IDKitWidget>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
