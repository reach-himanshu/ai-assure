import { useCurrentUser } from '@/stores';
import { AgentDash } from './AgentDash';
import { SupervisorDash } from './SupervisorDash';
import { QAAdminDash } from './QAAdminDash';
import { LeaderDash } from './LeaderDash';

export function Dashboard() {
  const me = useCurrentUser();
  if (!me) return null;
  switch (me.role) {
    case 'agent': return <AgentDash />;
    case 'supervisor': return <SupervisorDash />;
    case 'qa_admin': return <QAAdminDash />;
    case 'leader': return <LeaderDash />;
  }
}
