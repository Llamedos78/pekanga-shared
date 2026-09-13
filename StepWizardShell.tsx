'use client';

// pekanga-shared/StepWizardShell.tsx
//
// The single-topic, one-question-per-screen step shell first built for
// School's VisualGcseWizard.tsx (its own header comment explains why: the
// standard GcseWizard packs several decisions onto one screen, this splits
// that into genuinely single-topic screens, matching JED's pattern).
// Extracted verbatim (same markup/styling, zero behaviour change) so Advisor
// Subjects/Assessment can build real step-by-step flows instead of their
// current single-page forms with cosmetic "Step 1/2/3" labels, and so a
// later Pekanga College consumer never has to hand-copy this a third time.
//
// HEADLESS: no step data, no state, no navigation logic. This component only
// owns the progress bar, title/subtitle, and Back/Next buttons for ONE step
// — the caller owns the step list, current index, and per-step field
// rendering (same division of responsibility as ReportTabs.tsx: "the
// presentation wasn't shared, the data was").
//
// DYNAMIC / CONDITIONAL STEPS: stepIndex and totalSteps are plain numbers on
// purpose, not tied to a fixed step-id union — a caller with conditional
// steps (e.g. School's VisualSubjectPicker.tsx pushes a 'mixed-alevels' step
// onto its list only when qualType === 'mixed') builds its own `steps: Id[]`
// array per render and passes `stepIndex={steps.indexOf(current)}` /
// `totalSteps={steps.length}`. This shell re-renders correctly either way,
// since it never assumes the list is fixed.
//
// Left behind deliberately: VisualGcseWizard's MicBtn/useSpeechRecognition
// voice-input helper is backend-coupled (calls a Supabase Edge Function
// directly) and doesn't belong in a shell with no data fetching. Callers
// that want voice input keep their own copy, same as MicBtn's own existing
// duplication story (see that file's header comment).

export interface StepWizardShellProps {
  stepIndex: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}

export default function StepWizardShell({
  stepIndex, totalSteps, title, subtitle, children,
  onNext, onBack, nextLabel = 'Next →', nextDisabled = false,
}: StepWizardShellProps) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Step {stepIndex + 1} of {totalSteps}
          </span>
        </div>
        <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
          <div style={{ height: 4, background: 'var(--blue)', borderRadius: 2, width: `${((stepIndex + 1) / totalSteps) * 100}%`, transition: 'width 0.3s ease' }} />
        </div>
      </div>

      <div>
        <p style={{ fontFamily: 'var(--font-heading)', fontSize: 24, color: 'var(--navy)', marginBottom: 8 }}>{title}</p>
        {subtitle && <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{subtitle}</p>}
      </div>

      <div>{children}</div>

      <div style={{ display: 'flex', gap: 10 }}>
        {onBack && (
          <button onClick={onBack} style={{ flex: 1, padding: 14, background: '#fff', border: '1.5px solid var(--border)', borderRadius: 10, fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer' }}>
            ← Back
          </button>
        )}
        <button onClick={onNext} disabled={nextDisabled}
          style={{ flex: onBack ? 2 : 1, padding: 14, background: nextDisabled ? 'var(--border)' : 'var(--coral)', color: nextDisabled ? 'var(--text-muted)' : '#fff', border: 'none', borderRadius: 10, fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 700, cursor: nextDisabled ? 'not-allowed' : 'pointer', transition: 'background 0.18s' }}>
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
