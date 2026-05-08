import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useApp } from '@/stores';
import { PersonaPicker } from '@/features/login/PersonaPicker';
import { AppShell } from '@/features/shell/AppShell';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { EvaluationList } from '@/features/evaluations/EvaluationList';
import { EvaluationDetail } from '@/features/evaluations/EvaluationDetail';
import { QueueView } from '@/features/queue/QueueView';
import { Appeals } from '@/features/appeals/Appeals';
import { AdminConsole } from '@/features/admin/AdminConsole';
import { Insights } from '@/features/insights/Insights';
import { AgentProfile } from '@/features/agents/AgentProfile';

export default function App() {
  const init = useApp((s) => s.init);
  const theme = useApp((s) => s.theme);
  const textSize = useApp((s) => s.textSize);
  const logoVariant = useApp((s) => s.logoVariant);
  const toggleSidebar = useApp((s) => s.toggleSidebar);
  const currentUserId = useApp((s) => s.currentUserId);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Text size: drives root font-size; rem-based sizes scale automatically
  useEffect(() => {
    const px = textSize === 'small' ? '14px' : textSize === 'large' ? '18px' : '16px';
    document.documentElement.style.fontSize = px;
  }, [textSize]);

  // Update favicon to match the active logo variant
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) return;
    link.type = 'image/svg+xml';
    link.href = `/favicon-${logoVariant}.svg`;
  }, [logoVariant]);

  // Cmd/Ctrl+B toggles the sidebar (only when authenticated)
  useEffect(() => {
    if (!currentUserId) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentUserId, toggleSidebar]);

  return (
    <Routes>
      <Route path="/login" element={<PersonaPicker />} />
      <Route
        path="/app/*"
        element={currentUserId ? <AppShell /> : <Navigate to="/login" replace />}
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="evaluations" element={<EvaluationList />} />
        <Route path="evaluations/:id" element={<EvaluationDetail />} />
        <Route path="queue" element={<QueueView />} />
        <Route path="appeals" element={<Appeals />} />
        <Route path="admin" element={<AdminConsole />} />
        <Route path="insights" element={<Insights />} />
        <Route path="agents/:id" element={<AgentProfile />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
