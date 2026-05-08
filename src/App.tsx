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
  const currentUserId = useApp((s) => s.currentUserId);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

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
