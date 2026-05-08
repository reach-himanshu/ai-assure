import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useApp, useCurrentUser } from '@/stores';
import { Logo } from '@/components/Logo';
import { Avatar } from '@/components/Avatar';
import { ROLE_LABEL } from '@/lib/types';
import { ToastViewport } from '@/components/Toast';
import { fromNow } from '@/lib/dates';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles: ('agent' | 'supervisor' | 'qa_admin' | 'leader')[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/app/dashboard', label: 'Dashboard', icon: <NavIcon kind="dashboard" />, roles: ['agent', 'supervisor', 'qa_admin', 'leader'] },
  { to: '/app/evaluations', label: 'Evaluations', icon: <NavIcon kind="list" />, roles: ['agent', 'supervisor', 'qa_admin', 'leader'] },
  { to: '/app/queue', label: 'Review queue', icon: <NavIcon kind="queue" />, roles: ['supervisor', 'qa_admin'] },
  { to: '/app/appeals', label: 'Appeals', icon: <NavIcon kind="appeal" />, roles: ['agent', 'supervisor', 'qa_admin', 'leader'] },
  { to: '/app/insights', label: 'Insights', icon: <NavIcon kind="insights" />, roles: ['supervisor', 'qa_admin', 'leader'] },
  { to: '/app/admin', label: 'Configuration', icon: <NavIcon kind="settings" />, roles: ['qa_admin'] },
];

export function AppShell() {
  const me = useCurrentUser();
  const navigate = useNavigate();
  const navItems = useMemo(
    () => NAV_ITEMS.filter((n) => me ? n.roles.includes(me.role) : false),
    [me],
  );

  if (!me) return null;

  return (
    <div className="min-h-screen flex">
      <Sidebar navItems={navItems} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onLogout={() => navigate('/login')} />
        <main className="flex-1 px-8 py-6 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
        <ToastViewport />
      </div>
    </div>
  );
}

function Sidebar({ navItems }: { navItems: NavItem[] }) {
  return (
    <aside className="w-64 shrink-0 border-r border-line dark:border-line-dark bg-surface dark:bg-surface-dark flex flex-col">
      <div className="px-5 py-5">
        <Logo />
      </div>
      <nav className="px-3 flex-1 space-y-0.5">
        {navItems.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200'
                  : 'text-ink-muted hover:bg-surface-alt dark:hover:bg-surface-dark-alt hover:text-ink dark:hover:text-[#F1F5EE]',
              )
            }
          >
            <span className="w-5 h-5 flex items-center justify-center">{n.icon}</span>
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-line dark:border-line-dark text-xs text-ink-muted">
        AI-Assure prototype · {new Date().getFullYear()}
      </div>
    </aside>
  );
}

function TopBar({ onLogout }: { onLogout: () => void }) {
  const me = useCurrentUser();
  const users = useApp((s) => s.users);
  const setCurrentUser = useApp((s) => s.setCurrentUser);
  const theme = useApp((s) => s.theme);
  const toggleTheme = useApp((s) => s.toggleTheme);
  const audit = useApp((s) => s.audit);
  const evaluations = useApp((s) => s.evaluations);
  const resetDemo = useApp((s) => s.resetDemo);

  const [bellOpen, setBellOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Notifications derived for current persona
  const notifications = useMemo(() => {
    if (!me) return [];
    if (me.role === 'agent') {
      return evaluations
        .filter((e) => e.agentId === me.id && e.appeal && e.appeal.status !== 'open')
        .slice(-5)
        .reverse()
        .map((e) => ({
          id: `agent-appeal-${e.id}`,
          text: `Your appeal on ${e.id} was ${e.appeal!.status}.`,
          at: e.appeal!.decidedAt ?? e.appeal!.filedAt,
        }));
    }
    if (me.role === 'supervisor') {
      const teamAgentIds = new Set(users.filter((u) => u.supervisorId === me.id).map((u) => u.id));
      return evaluations
        .filter((e) => teamAgentIds.has(e.agentId) && (e.appeal?.status === 'open' || e.band === 'fail'))
        .slice(-6)
        .reverse()
        .map((e) => ({
          id: `sup-${e.id}`,
          text: e.appeal?.status === 'open'
            ? `${e.agentName} filed an appeal on ${e.id}.`
            : `${e.agentName} scored below 75% on ${e.id}.`,
          at: e.appeal?.filedAt ?? e.caseDateTime,
        }));
    }
    return audit.slice(-5).reverse().map((a) => ({
      id: a.id,
      text: `${a.actorName} · ${a.action}`,
      at: a.at,
    }));
  }, [me, evaluations, users, audit]);

  if (!me) return null;

  return (
    <header className="border-b border-line dark:border-line-dark bg-surface dark:bg-surface-dark sticky top-0 z-30">
      <div className="px-8 py-3 flex items-center justify-between gap-4">
        <div className="text-sm text-ink-muted">
          Welcome back, <span className="font-semibold text-ink dark:text-[#F1F5EE]">{me.name.split(' ')[0]}</span> · viewing as {ROLE_LABEL[me.role]}
        </div>
        <div className="flex items-center gap-2">
          {/* Persona switcher */}
          <select
            className="input py-1.5 text-sm w-auto"
            value={me.id}
            onChange={(e) => setCurrentUser(e.target.value)}
            aria-label="Switch persona"
          >
            <optgroup label="Agents">
              {users.filter((u) => u.role === 'agent').map((u) => (
                <option key={u.id} value={u.id}>{u.name} · Agent</option>
              ))}
            </optgroup>
            <optgroup label="Supervisors">
              {users.filter((u) => u.role === 'supervisor').map((u) => (
                <option key={u.id} value={u.id}>{u.name} · Supervisor</option>
              ))}
            </optgroup>
            <optgroup label="QA Admins">
              {users.filter((u) => u.role === 'qa_admin').map((u) => (
                <option key={u.id} value={u.id}>{u.name} · QA Admin</option>
              ))}
            </optgroup>
            <optgroup label="Leaders">
              {users.filter((u) => u.role === 'leader').map((u) => (
                <option key={u.id} value={u.id}>{u.name} · Leader</option>
              ))}
            </optgroup>
          </select>

          {/* Theme toggle */}
          <button
            className="btn-ghost p-2"
            aria-label="Toggle dark mode"
            onClick={toggleTheme}
          >
            {theme === 'light' ? (
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            )}
          </button>

          {/* Bell */}
          <div className="relative">
            <button
              onClick={() => setBellOpen((o) => !o)}
              className="btn-ghost p-2 relative"
              aria-label="Notifications"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16l-2-2zM10 21a2 2 0 0 0 4 0" />
              </svg>
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-band-fail" />
              )}
            </button>
            {bellOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-surface dark:bg-surface-dark-alt rounded-xl shadow-pop border border-line dark:border-line-dark overflow-hidden z-40">
                <div className="px-4 py-3 border-b border-line dark:border-line-dark text-sm font-semibold">
                  Recent activity
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-sm text-ink-muted text-center">
                      Nothing new — nicely done.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="px-4 py-3 border-b border-line dark:border-line-dark last:border-b-0">
                        <p className="text-sm">{n.text}</p>
                        <p className="text-xs text-ink-muted mt-1">{fromNow(n.at)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              className="flex items-center gap-2 rounded-xl py-1.5 pl-1 pr-3 hover:bg-surface-alt dark:hover:bg-surface-dark-alt"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <Avatar initials={me.initials} color={me.avatarColor} size="sm" />
              <span className="text-sm font-medium hidden md:inline">{me.name.split(' ')[0]}</span>
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-ink-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-surface dark:bg-surface-dark-alt rounded-xl shadow-pop border border-line dark:border-line-dark overflow-hidden z-40">
                <div className="px-4 py-3 border-b border-line dark:border-line-dark">
                  <div className="font-semibold">{me.name}</div>
                  <div className="text-xs text-ink-muted">{me.email}</div>
                </div>
                <button
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-alt dark:hover:bg-surface-dark"
                  onClick={() => {
                    if (window.confirm('This will reset the demo data back to the original seed. Continue?')) {
                      resetDemo();
                      onLogout();
                    }
                  }}
                >
                  Reset demo
                </button>
                <button
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-alt dark:hover:bg-surface-dark"
                  onClick={onLogout}
                >
                  Switch persona
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function NavIcon({ kind }: { kind: 'dashboard' | 'list' | 'queue' | 'appeal' | 'insights' | 'settings' }) {
  const props = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, width: 18, height: 18 };
  switch (kind) {
    case 'dashboard': return <svg {...props}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>;
    case 'list': return <svg {...props}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>;
    case 'queue': return <svg {...props}><path d="M3 6h18M5 12h14M8 18h8" /></svg>;
    case 'appeal': return <svg {...props}><path d="M14 9V5a3 3 0 0 0-6 0v4" /><rect x="3" y="9" width="18" height="12" rx="2" /></svg>;
    case 'insights': return <svg {...props}><path d="M3 3v18h18M7 14l3-3 4 4 5-7" /></svg>;
    case 'settings': return <svg {...props}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>;
  }
}
