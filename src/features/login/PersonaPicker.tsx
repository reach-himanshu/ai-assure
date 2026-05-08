import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useApp } from '@/stores';
import { Logo } from '@/components/Logo';
import { LogoMark, VARIANT_LABEL, VARIANT_DESCRIPTION } from '@/components/LogoMark';
import { Avatar } from '@/components/Avatar';
import type { LogoVariant } from '@/lib/types';
import { ROLE_LABEL } from '@/lib/types';
import { LEADERS, QA_ADMINS, SUPERVISORS, AGENTS } from '@/data/people';

const PERSONA_GROUPS: { group: string; users: typeof LEADERS; description: string }[] = [
  { group: 'Agent', description: 'View your evaluations, file appeals, read coaching notes.', users: AGENTS.slice(0, 3) },
  { group: 'Supervisor', description: 'Review your team, decide on appeals, work the HITL queue.', users: SUPERVISORS.slice(0, 2) },
  { group: 'QA Admin', description: 'Edit rubrics & thresholds, approve evaluations globally, audit log.', users: QA_ADMINS.slice(0, 2) },
  { group: 'Leader', description: 'Org-wide trends, themes, CSAT, channel mix.', users: LEADERS },
];

export function PersonaPicker() {
  const navigate = useNavigate();
  const setCurrentUser = useApp((s) => s.setCurrentUser);
  const resetDemo = useApp((s) => s.resetDemo);

  const onPick = (id: string) => {
    setCurrentUser(id);
    navigate('/app/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-10 py-6 flex items-center justify-between">
        <Logo />
        <button
          className="btn-ghost text-sm"
          onClick={() => {
            resetDemo();
          }}
        >
          Reset demo data
        </button>
      </header>
      <main className="flex-1 px-10 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 mt-4">
            <p className="label text-brand-700 dark:text-brand-400 mb-3">A Quality Intelligence Platform</p>
            <h1 className="text-4xl tracking-tight">
              Welcome to <span className="text-brand-600 dark:text-brand-400">AI-Assure</span>
            </h1>
            <p className="text-ink-muted mt-3 max-w-2xl mx-auto">
              Pick a persona to enter the demo. Everything you do — appeals, decisions,
              threshold tweaks — is saved locally so the experience stays consistent across refreshes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {PERSONA_GROUPS.map((g) => (
              <section key={g.group} className="card">
                <header className="flex items-baseline justify-between mb-4">
                  <h2 className="text-lg">{g.group}</h2>
                  <span className="text-xs text-ink-muted">{g.users.length} demo users</span>
                </header>
                <p className="text-sm text-ink-muted mb-5">{g.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {g.users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => onPick(u.id)}
                      className="text-left rounded-xl border border-line dark:border-line-dark bg-surface-alt dark:bg-surface-dark px-4 py-3 hover:border-brand-500 hover:shadow-card transition-all flex items-center gap-3"
                    >
                      <Avatar initials={u.initials} color={u.avatarColor} size="md" />
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{u.name}</div>
                        <div className="text-xs text-ink-muted truncate">{u.title || ROLE_LABEL[u.role]}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <LogoStylePicker />

          <p className="text-center text-xs text-ink-muted mt-8">
            Synthetic data only. No real customer or employee information is used. AI scoring shown is
            illustrative — this is a UX prototype, not a live model.
          </p>
        </div>
      </main>
    </div>
  );
}

function LogoStylePicker() {
  const variant = useApp((s) => s.logoVariant);
  const setLogoVariant = useApp((s) => s.setLogoVariant);
  const variants: LogoVariant[] = ['spark', 'waves', 'a-spark'];
  return (
    <section className="card mt-10">
      <header className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg">Logo style</h2>
        <span className="text-xs text-ink-muted">Pick one — applies everywhere instantly</span>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {variants.map((v) => (
          <button
            key={v}
            onClick={() => setLogoVariant(v)}
            className={clsx(
              'rounded-xl border px-4 py-3 text-left transition-all flex items-center gap-3',
              variant === v
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-card'
                : 'border-line dark:border-line-dark bg-surface-alt dark:bg-surface-dark hover:border-brand-300',
            )}
            aria-pressed={variant === v}
          >
            <LogoMark variant={v} size={40} />
            <div className="min-w-0">
              <div className="font-semibold">{VARIANT_LABEL[v]}</div>
              <div className="text-xs text-ink-muted">{VARIANT_DESCRIPTION[v]}</div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
