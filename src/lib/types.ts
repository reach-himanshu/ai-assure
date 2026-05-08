export type Channel = 'call' | 'email' | 'portal' | 'chat' | 'csat';
export type Band = 'pass' | 'needs_review' | 'fail';
export type Role = 'agent' | 'supervisor' | 'qa_admin' | 'leader';

export type ContributionRating =
  | 'exceptional'
  | 'full'
  | 'inconsistent'
  | 'learning'
  | 'attention';

export type CriterionScale = 'fpnna' | 'ynna';
export type CriterionValue = 'full' | 'partial' | 'none' | 'na' | 'yes' | 'no';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  team?: string;          // for agents and supervisors
  supervisorId?: string;  // for agents
  avatarColor: string;    // for circle avatars
  initials: string;
  title?: string;         // e.g. 'HR4U Agent', 'Senior Supervisor'
}

export interface RubricCriterion {
  id: string;
  label: string;
  weightPct?: number;
  scaleType: CriterionScale;
  value: CriterionValue;
  evidenceQuoteIds: string[];
  rationale: string;
}

export interface RubricSection {
  id: 'courteous' | 'accurate_reliable' | 'personalized' | 'requirements' | 'call_control';
  label: string;
  weightPct?: number;
  criteria: RubricCriterion[];
  contribution: ContributionRating;
  comments: string;
  sectionScorePct: number;
}

export interface EvidenceQuote {
  id: string;
  text: string;
  speaker?: 'agent' | 'customer';
  startMs?: number;
  charStart?: number;
  criterionId: string;
}

export interface TranscriptTurn {
  id: string;
  speaker: 'agent' | 'customer';
  text: string;
  timestampMs?: number;
}

export type EvaluationStatus =
  | 'auto_approved'
  | 'pending_review'
  | 'reviewer_approved'
  | 'overridden'
  | 'pii_hold';

export type EvaluationFlag = 'pii' | 'low_confidence' | 'random_sample' | 'exception';

export interface ReviewerComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  text: string;
  at: string;
}

export interface CSATData {
  score: 1 | 2 | 3 | 4 | 5;
  verbatim: string;
  sentiment: 'pos' | 'neu' | 'neg';
  themes: string[];
}

export interface AppealRecord {
  id: string;
  evaluationId: string;
  agentId: string;
  filedAt: string;
  reason: string;
  agentComment: string;
  attachmentName?: string;
  status: 'open' | 'upheld' | 'overturned' | 'partially_adjusted';
  decidedBy?: string;
  decidedByName?: string;
  decidedAt?: string;
  scoreDeltaPct?: number;
  decisionNotes?: string;
}

export interface Evaluation {
  id: string;
  channel: Channel;
  agentId: string;
  agentName: string;
  caseDateTime: string;
  reviewedBy: string;
  snowCaseNumber: string;
  hrcCaseNumber?: string;
  callUrl?: string;
  summary: string;

  overallPct: number;
  band: Band;
  aiConfidencePct: number;
  status: EvaluationStatus;

  sections: RubricSection[];
  evidence: EvidenceQuote[];

  // content
  transcript?: TranscriptTurn[];   // call/chat
  emailBody?: string;              // email/portal
  csat?: CSATData;

  // integrations
  genesys?: { recordingId: string; durationSec: number; queue: string };
  servicenow: { caseId: string; category: string; status: string };

  // workflow
  appeal?: AppealRecord;
  comments: ReviewerComment[];
  flags: EvaluationFlag[];
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  action: string;
  targetId: string;
  before?: unknown;
  after?: unknown;
}

export interface ConfigState {
  autoApproveThresholdPct: number;
  lowConfidenceThresholdPct: number;
  samplingPct: number;
  passBandPct: number;
  needsReviewFloorPct: number;
  appealWindowDays: number;
  // editable rubric weights & criterion labels keyed by section/criterion id
  weights: {
    email: { sectionWeights: Record<string, number>; criterionWeights: Record<string, number> };
  };
  criterionLabels: Record<string, string>;
}

export const CHANNEL_LABEL: Record<Channel, string> = {
  call: 'Call',
  email: 'Email',
  portal: 'Portal',
  chat: 'Chat',
  csat: 'CSAT',
};

export const BAND_LABEL: Record<Band, string> = {
  pass: 'Pass',
  needs_review: 'Needs review',
  fail: 'Fail',
};

export const STATUS_LABEL: Record<EvaluationStatus, string> = {
  auto_approved: 'Auto-approved',
  pending_review: 'Pending review',
  reviewer_approved: 'Reviewer approved',
  overridden: 'Overridden',
  pii_hold: 'PII hold',
};

export const CONTRIBUTION_LABEL: Record<ContributionRating, string> = {
  exceptional: 'Exceptional',
  full: 'Full',
  inconsistent: 'Inconsistent',
  learning: 'Learning',
  attention: 'Needs attention',
};

export const ROLE_LABEL: Record<Role, string> = {
  agent: 'Agent',
  supervisor: 'Supervisor',
  qa_admin: 'QA Admin',
  leader: 'Leader',
};
