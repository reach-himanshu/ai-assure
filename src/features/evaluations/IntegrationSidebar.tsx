import type { Evaluation } from '@/lib/types';
import { useApp } from '@/stores';
import { durationLabel, formatDateTime } from '@/lib/dates';

export function IntegrationSidebar({ evaluation }: { evaluation: Evaluation }) {
  return (
    <div className="space-y-4">
      <Header evaluation={evaluation} />
      <AgentContextCard evaluation={evaluation} />
      {evaluation.genesys && <GenesysCard genesys={evaluation.genesys} />}
      {evaluation.channel === 'chat' ? (
        <>
          <ChatInteractionCard imsCaseNumber={evaluation.imsCaseNumber!} hrcCaseNumber={evaluation.hrcCaseNumber} />
          <ServiceNowCard servicenow={evaluation.servicenow} hrcCaseNumber={evaluation.hrcCaseNumber} linkedFromIMS />
        </>
      ) : (
        <ServiceNowCard servicenow={evaluation.servicenow} hrcCaseNumber={evaluation.hrcCaseNumber} />
      )}
      <CaseMetaCard evaluation={evaluation} />
    </div>
  );
}

function Header({ evaluation }: { evaluation: Evaluation }) {
  return (
    <div className="card-tight">
      <p className="label">Reviewed by</p>
      <p className="text-sm font-semibold mt-0.5">{evaluation.reviewedBy}</p>
      <p className="text-xs text-ink-muted mt-2">Case date · {formatDateTime(evaluation.caseDateTime)}</p>
    </div>
  );
}

function AgentContextCard({ evaluation }: { evaluation: Evaluation }) {
  const agent = useApp((s) => s.users.find((u) => u.id === evaluation.agentId));
  const employmentType = evaluation.employmentTypeAtTime ?? agent?.employmentType;
  const vendor = evaluation.vendorAtTime ?? agent?.vendor;
  const nesting = !!evaluation.nestingAtTime;
  if (!employmentType && !nesting) return null;
  return (
    <div className="card-tight">
      <p className="label mb-2">Agent context</p>
      {employmentType && (
        <Row
          label="Employee type"
          value={employmentType === 'associate' ? 'Humana Associate' : `Contractor${vendor ? ' · ' + vendor : ''}`}
        />
      )}
      {nesting ? (
        <div className="mt-2">
          <span className="pill bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 12a9 9 0 1 1 18 0 9 9 0 0 1-18 0zM12 7v5l3 2" />
            </svg>
            In nesting (90-day window)
          </span>
          <p className="text-xs text-ink-muted mt-1.5">Score does not count toward team or org averages.</p>
        </div>
      ) : (
        <Row label="Nesting" value="No" />
      )}
    </div>
  );
}

function GenesysCard({ genesys }: { genesys: NonNullable<Evaluation['genesys']> }) {
  return (
    <div className="card-tight">
      <div className="flex items-center justify-between mb-3">
        <p className="label">Genesys</p>
        <span className="pill bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200">Recording</span>
      </div>
      <Row label="Recording ID" value={genesys.recordingId} mono />
      <Row label="Duration" value={durationLabel(genesys.durationSec)} />
      <Row label="Queue" value={genesys.queue} />
      <button className="btn-secondary w-full mt-3 text-sm">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polygon points="5,3 19,12 5,21" fill="currentColor" stroke="none" />
        </svg>
        Open recording
      </button>
    </div>
  );
}

function ChatInteractionCard({ imsCaseNumber, hrcCaseNumber }: { imsCaseNumber: string; hrcCaseNumber: string }) {
  return (
    <div className="card-tight">
      <div className="flex items-center justify-between mb-3">
        <p className="label">ServiceNow · interaction</p>
        <span className="pill bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200">Chat</span>
      </div>
      <Row label="Interaction ID" value={imsCaseNumber} mono />
      <Row label="Linked case" value={hrcCaseNumber} mono />
      <p className="text-xs text-ink-muted mt-2 leading-relaxed">
        IMS interaction record from the chat session. Linked to HRC once a live agent picked up the conversation.
      </p>
    </div>
  );
}

function ServiceNowCard({
  servicenow,
  hrcCaseNumber,
  linkedFromIMS,
}: {
  servicenow: Evaluation['servicenow'];
  hrcCaseNumber: string;
  linkedFromIMS?: boolean;
}) {
  return (
    <div className="card-tight">
      <div className="flex items-center justify-between mb-3">
        <p className="label">ServiceNow · case</p>
        <span className="pill bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
          {linkedFromIMS ? 'Linked HRC' : 'Case'}
        </span>
      </div>
      <Row label="Case ID" value={hrcCaseNumber} mono />
      <Row label="Category" value={servicenow.category} />
      <Row label="Status" value={servicenow.status} />
      <button className="btn-secondary w-full mt-3 text-sm">
        Open case
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 3h7v7M21 3l-9 9M5 5h7M5 19h14V11" />
        </svg>
      </button>
    </div>
  );
}

function CaseMetaCard({ evaluation }: { evaluation: Evaluation }) {
  return (
    <div className="card-tight">
      <p className="label mb-2">Reference numbers</p>
      <Row label="Evaluation" value={evaluation.id} mono />
      <Row label="HRC case" value={evaluation.hrcCaseNumber} mono />
      {evaluation.imsCaseNumber && <Row label="IMS interaction" value={evaluation.imsCaseNumber} mono />}
      <Row label="Agent" value={evaluation.agentName} />
      {evaluation.flags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {evaluation.flags.map((f) => (
            <span key={f} className="pill bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200">
              {f.replace('_', ' ')}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="text-ink-muted">{label}</span>
      <span className={mono ? 'font-mono text-xs' : 'font-medium'}>{value}</span>
    </div>
  );
}
