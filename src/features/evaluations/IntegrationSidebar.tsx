import type { Evaluation } from '@/lib/types';
import { durationLabel, formatDateTime } from '@/lib/dates';

export function IntegrationSidebar({ evaluation }: { evaluation: Evaluation }) {
  return (
    <div className="space-y-4">
      <Header evaluation={evaluation} />
      {evaluation.genesys && <GenesysCard genesys={evaluation.genesys} />}
      <ServiceNowCard servicenow={evaluation.servicenow} />
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

function ServiceNowCard({ servicenow }: { servicenow: Evaluation['servicenow'] }) {
  return (
    <div className="card-tight">
      <div className="flex items-center justify-between mb-3">
        <p className="label">ServiceNow</p>
        <span className="pill bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">Case</span>
      </div>
      <Row label="Case ID" value={servicenow.caseId} mono />
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
      {evaluation.hrcCaseNumber && <Row label="HRC case" value={evaluation.hrcCaseNumber} mono />}
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
