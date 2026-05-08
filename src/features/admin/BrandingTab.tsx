import clsx from 'clsx';
import { useApp } from '@/stores';
import { LogoMark, VARIANT_LABEL as LOGO_LABEL, VARIANT_DESCRIPTION as LOGO_DESC } from '@/components/LogoMark';
import { AppealIcon } from '@/features/shell/AppShell';
import type { AppealIconVariant, LogoVariant } from '@/lib/types';

const APPEAL_VARIANT_LABEL: Record<AppealIconVariant, string> = {
  'raised-hand': 'Raised hand',
  scroll: 'Scroll',
  gavel: 'Gavel',
};

const APPEAL_VARIANT_DESCRIPTION: Record<AppealIconVariant, string> = {
  'raised-hand': "Universal 'I'd like to be heard' gesture. Friendly and unambiguous.",
  scroll: 'Petition / formal-request feel. Slightly riskier legibility at small sizes.',
  gavel: 'Decision / judgment metaphor. Clear but more adversarial.',
};

export function BrandingTab() {
  const logoVariant = useApp((s) => s.logoVariant);
  const setLogoVariant = useApp((s) => s.setLogoVariant);
  const appealIconVariant = useApp((s) => s.appealIconVariant);
  const setAppealIconVariant = useApp((s) => s.setAppealIconVariant);

  const logoVariants: LogoVariant[] = ['spark', 'waves', 'a-spark'];
  const appealVariants: AppealIconVariant[] = ['raised-hand', 'scroll', 'gavel'];

  return (
    <div className="space-y-5">
      <section className="card">
        <header className="mb-4">
          <h2 className="text-lg">Site logo</h2>
          <p className="text-sm text-ink-muted">Picks apply everywhere instantly — header, login, browser tab favicon.</p>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {logoVariants.map((v) => (
            <button
              key={v}
              onClick={() => setLogoVariant(v)}
              className={clsx(
                'rounded-xl border px-4 py-3 text-left transition-all flex items-center gap-3',
                logoVariant === v
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-card'
                  : 'border-line dark:border-line-dark bg-surface-alt dark:bg-surface-dark hover:border-brand-300',
              )}
              aria-pressed={logoVariant === v}
            >
              <LogoMark variant={v} size={40} />
              <div className="min-w-0">
                <div className="font-semibold">{LOGO_LABEL[v]}</div>
                <div className="text-xs text-ink-muted">{LOGO_DESC[v]}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <header className="mb-4">
          <h2 className="text-lg">Appeal icon</h2>
          <p className="text-sm text-ink-muted">Used in the sidebar nav and on appeal-related buttons.</p>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {appealVariants.map((v) => (
            <button
              key={v}
              onClick={() => setAppealIconVariant(v)}
              className={clsx(
                'rounded-xl border px-4 py-3 text-left transition-all flex items-center gap-3',
                appealIconVariant === v
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-card'
                  : 'border-line dark:border-line-dark bg-surface-alt dark:bg-surface-dark hover:border-brand-300',
              )}
              aria-pressed={appealIconVariant === v}
            >
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-surface dark:bg-surface-dark-alt text-brand-700 dark:text-brand-300">
                <AppealIcon variant={v} size={24} />
              </span>
              <div className="min-w-0">
                <div className="font-semibold">{APPEAL_VARIANT_LABEL[v]}</div>
                <div className="text-xs text-ink-muted">{APPEAL_VARIANT_DESCRIPTION[v]}</div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
