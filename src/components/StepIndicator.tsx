import { ShieldCheck, Fingerprint, Users, Sparkles, Check, Lock } from 'lucide-react';

interface Step {
  label: string;
  icon: React.ElementType;
  status: 'completed' | 'active' | 'locked';
}

interface StepIndicatorProps {
  worldIdVerified: boolean;
  clawKeyVerified: boolean;
  moltbookRegistered: boolean;
}

export default function StepIndicator({ worldIdVerified, clawKeyVerified, moltbookRegistered }: StepIndicatorProps) {
  const steps: Step[] = [
    {
      label: 'Personhood',
      icon: ShieldCheck,
      status: worldIdVerified ? 'completed' : 'active',
    },
    {
      label: 'ClawKey',
      icon: Fingerprint,
      status: clawKeyVerified ? 'completed' : worldIdVerified ? 'active' : 'locked',
    },
    {
      label: 'Moltbook',
      icon: Users,
      status: moltbookRegistered ? 'completed' : (worldIdVerified && clawKeyVerified) ? 'active' : 'locked',
    },
    {
      label: 'Mint',
      icon: Sparkles,
      status: (worldIdVerified && clawKeyVerified && moltbookRegistered) ? 'active' : 'locked',
    },
  ];

  const currentStepIndex = steps.findIndex(s => s.status === 'active');
  const currentStep = steps[currentStepIndex];

  return (
    <>
      {/* Mobile: compact single-line */}
      <div className="lg:hidden mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-foreground font-medium">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
          <span>—</span>
          <span>{currentStep?.label}</span>
        </div>
        {/* Mini dots */}
        <div className="flex gap-1.5 mt-2">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step.status === 'completed'
                  ? 'w-8 bg-accent'
                  : step.status === 'active'
                  ? 'w-8 bg-gradient-to-r from-[hsl(var(--gradient-cyan))] to-[hsl(var(--gradient-magenta))]'
                  : 'w-4 bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Desktop: horizontal stepper */}
      <div className="hidden lg:flex items-center justify-between mb-8">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              {/* Step node */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    step.status === 'completed'
                      ? 'bg-accent/20 border border-accent/40'
                      : step.status === 'active'
                      ? 'bg-gradient-to-br from-[hsl(var(--gradient-cyan))] to-[hsl(var(--gradient-magenta))] shadow-[0_0_20px_-5px_hsl(var(--primary)/0.4)]'
                      : 'bg-muted/50 border border-border'
                  }`}
                >
                  {step.status === 'completed' ? (
                    <Check className="w-4 h-4 text-accent" />
                  ) : step.status === 'locked' ? (
                    <Lock className="w-4 h-4 text-muted-foreground/50" />
                  ) : (
                    <Icon className="w-4 h-4 text-white" />
                  )}
                  {step.status === 'active' && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[hsl(var(--gradient-cyan))] to-[hsl(var(--gradient-magenta))] opacity-40 animate-pulse" />
                  )}
                </div>
                <span
                  className={`text-xs font-medium transition-colors ${
                    step.status === 'completed'
                      ? 'text-accent'
                      : step.status === 'active'
                      ? 'text-foreground'
                      : 'text-muted-foreground/50'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="flex-1 mx-3 mt-[-1.25rem]">
                  <div
                    className={`h-0.5 rounded-full transition-all duration-500 ${
                      steps[i + 1].status !== 'locked'
                        ? 'bg-gradient-to-r from-accent to-[hsl(var(--gradient-cyan))]'
                        : 'bg-border'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
