import dayjs from 'dayjs';
import type {
  AppealRecord,
  AuditEntry,
  Channel,
  CSATData,
  Evaluation,
  EvaluationFlag,
  EvaluationStatus,
  EvidenceQuote,
  ReviewerComment,
  RubricCriterion,
  RubricSection,
  TranscriptTurn,
  User,
} from '@/lib/types';
import { rubricForChannel } from '@/lib/rubric';
import { recomputeEvaluation } from '@/lib/scoring';
import { DEFAULT_CONFIG } from '@/lib/rubric';
import { makeRng, type Rng } from '@/lib/rng';
import { isNestingAt } from '@/lib/dates';
import { ALL_USERS, AGENTS, SUPERVISORS, QA_ADMINS } from './people';
import {
  CALL_SCENARIOS,
  EMAIL_SCENARIOS,
  CHAT_SCENARIOS,
  PORTAL_SCENARIOS,
  CSAT_SCENARIOS,
  SHORT_SUMMARIES,
  CATEGORIES_BY_CHANNEL,
  QUEUES,
  type CallScenario,
  type TextScenario,
} from './scenarios';

const SEED_NUM = 73_42_19;

const CHANNEL_DISTRIBUTION: { channel: Channel; weight: number }[] = [
  { channel: 'call', weight: 38 },
  { channel: 'email', weight: 28 },
  { channel: 'chat', weight: 12 },
  { channel: 'portal', weight: 8 },
  { channel: 'csat', weight: 14 },
];

// 60-day window ending today
const DAYS = 60;

export interface Seed {
  users: User[];
  evaluations: Evaluation[];
  audit: AuditEntry[];
  channelVolumes: Record<string, number>;
  channelMonthlyVolumes: { month: string; calls: number; emails: number; chats: number; portal: number; csat: number }[];
}

export function generateSeed(): Seed {
  const rng = makeRng(SEED_NUM);
  const users = ALL_USERS;

  const evaluations: Evaluation[] = [];

  // Aim for ~800 detailed evaluations across 60 days
  const TARGET = 800;

  // Track which rich scenarios have been used so we can rotate
  let richCallIdx = 0;
  let richEmailIdx = 0;
  let richChatIdx = 0;
  let richPortalIdx = 0;

  // Build pool of rich slots — distribute ~80 across channels
  const RICH_PER_CHANNEL: Record<Channel, number> = { call: 30, email: 22, chat: 16, portal: 12, csat: 0 };
  const richBudget: Record<Channel, number> = { ...RICH_PER_CHANNEL };

  for (let i = 0; i < TARGET; i++) {
    const channel = rng.weighted(
      CHANNEL_DISTRIBUTION.map((d) => ({ item: d.channel, weight: d.weight })),
    );
    const agent = rng.pick(AGENTS);
    // Random datetime in last DAYS days
    const dayOffset = rng.int(0, DAYS - 1);
    const hours = rng.int(7, 18);
    const minutes = rng.int(0, 59);
    const dt = dayjs().subtract(dayOffset, 'day').hour(hours).minute(minutes).second(0);

    const wantsRich = richBudget[channel] > 0 && rng.chance(0.45);

    const evalRec = buildEvaluation({
      rng,
      idx: i,
      channel,
      agent,
      caseDateTime: dt.toISOString(),
      richCallIdx: wantsRich ? richCallIdx : -1,
      richEmailIdx: wantsRich ? richEmailIdx : -1,
      richChatIdx: wantsRich ? richChatIdx : -1,
      richPortalIdx: wantsRich ? richPortalIdx : -1,
    });

    if (wantsRich) {
      richBudget[channel] -= 1;
      if (channel === 'call') richCallIdx = (richCallIdx + 1) % CALL_SCENARIOS.length;
      if (channel === 'email') richEmailIdx = (richEmailIdx + 1) % EMAIL_SCENARIOS.length;
      if (channel === 'chat') richChatIdx = (richChatIdx + 1) % CHAT_SCENARIOS.length;
      if (channel === 'portal') richPortalIdx = (richPortalIdx + 1) % PORTAL_SCENARIOS.length;
    }

    evaluations.push(evalRec);
  }

  // Pre-populate ~8 appeals at various stages
  const appealCandidates = evaluations.filter(
    (e) =>
      e.band !== 'pass' &&
      dayjs(e.caseDateTime).isAfter(dayjs().subtract(7, 'day')),
  );
  const preAppeals = rng.shuffle(appealCandidates).slice(0, 8);
  preAppeals.forEach((e, idx) => {
    const supervisor = SUPERVISORS.find(
      (s) => AGENTS.find((a) => a.id === e.agentId)?.supervisorId === s.id,
    );
    const filedAt = dayjs(e.caseDateTime).add(rng.int(1, 4), 'day').toISOString();
    const status: AppealRecord['status'] = idx < 3 ? 'open' : rng.pick(['upheld', 'overturned', 'partially_adjusted'] as const);
    const decided = status !== 'open';
    const scoreDelta = status === 'overturned' ? 20 : status === 'partially_adjusted' ? 8 : 0;
    e.appeal = {
      id: `appeal-seed-${idx}`,
      evaluationId: e.id,
      agentId: e.agentId,
      filedAt,
      reason: rng.pick([
        'AI scored a criterion incorrectly — evidence does not support "No".',
        "I provided the standard closing — please re-review the last 30 seconds.",
        "The customer's tone was already escalated when I picked up; my empathy met the moment.",
        'I authenticated via the alternate verification path; system did not flag it.',
      ]),
      agentComment:
        'Please re-review against the rubric — happy to walk through the specific moment if useful.',
      attachmentName: idx % 3 === 0 ? 'rebuttal-notes.pdf' : undefined,
      status,
      decidedBy: decided ? supervisor?.id : undefined,
      decidedByName: decided ? supervisor?.name : undefined,
      decidedAt: decided ? dayjs(filedAt).add(rng.int(1, 3), 'day').toISOString() : undefined,
      scoreDeltaPct: decided ? scoreDelta : undefined,
      decisionNotes: decided
        ? rng.pick([
            'Reviewed transcript at the cited timestamp; agreed with agent — adjusting score.',
            'Original scoring stands. Empathy criterion was met but accuracy was incomplete.',
            'Partial adjustment for documentation; closing remains a learning opportunity.',
          ])
        : undefined,
    };
    if (decided && scoreDelta) {
      e.overallPct = Math.min(100, e.overallPct + scoreDelta);
      e.band = e.overallPct >= 90 ? 'pass' : e.overallPct >= 75 ? 'needs_review' : 'fail';
    }
  });

  // Channel volumes (claimed in dashboards)
  const monthly = [-1, 0].map((offset) => {
    const m = dayjs().add(offset, 'month');
    return {
      month: m.format('MMM YYYY'),
      calls: 9000 + Math.round((rng.next() - 0.5) * 800),
      emails: 7000 + Math.round((rng.next() - 0.5) * 600),
      chats: 3000 + Math.round((rng.next() - 0.5) * 400),
      portal: 1500 + Math.round((rng.next() - 0.5) * 200),
      csat: 2500 + Math.round((rng.next() - 0.5) * 300),
    };
  });

  const channelVolumes = {
    call: monthly.reduce((s, m) => s + m.calls, 0),
    email: monthly.reduce((s, m) => s + m.emails, 0),
    chat: monthly.reduce((s, m) => s + m.chats, 0),
    portal: monthly.reduce((s, m) => s + m.portal, 0),
    csat: monthly.reduce((s, m) => s + m.csat, 0),
  };

  // Initial audit log
  const audit: AuditEntry[] = [
    {
      id: 'audit-init',
      at: dayjs().subtract(60, 'day').toISOString(),
      actorId: QA_ADMINS[0]!.id,
      actorName: QA_ADMINS[0]!.name,
      actorRole: 'qa_admin',
      action: 'config.initialized',
      targetId: 'config',
      after: { autoApproveThresholdPct: 92, samplingPct: 5 },
    },
  ];

  return {
    users,
    evaluations,
    audit,
    channelVolumes,
    channelMonthlyVolumes: monthly,
  };
}

interface BuildArgs {
  rng: Rng;
  idx: number;
  channel: Channel;
  agent: User;
  caseDateTime: string;
  richCallIdx: number;
  richEmailIdx: number;
  richChatIdx: number;
  richPortalIdx: number;
}

function buildEvaluation(args: BuildArgs): Evaluation {
  const { rng, idx, channel, agent, caseDateTime } = args;

  const evalId = `EVAL-${(60000 + idx).toString()}`;
  const hrcDigits = (8_000_000 + rng.int(0, 1_999_999)).toString().padStart(7, '0');
  const hrcCaseNumber = `HRC${hrcDigits}`;
  const imsCaseNumber =
    channel === 'chat'
      ? `IMS${(2_000_000 + rng.int(0, 1_999_999)).toString().padStart(7, '0')}`
      : undefined;
  const callUrl = channel === 'call' ? `https://genesys.hr4u.example/recordings/${rng.int(100000, 999999)}` : undefined;

  // Pick scenario / summary
  let summary = '';
  let transcript: TranscriptTurn[] | undefined;
  let emailBody: string | undefined;
  let evidence: EvidenceQuote[] = [];
  let rubric: RubricSection[] = rubricForChannel(channel);
  let csat: CSATData | undefined;
  let category = rng.pick(CATEGORIES_BY_CHANNEL[channel] ?? ['General']);
  let queue = rng.pick(QUEUES);

  if (channel === 'csat') {
    const sc = rng.pick(CSAT_SCENARIOS);
    summary = `CSAT survey response (score ${sc.score}/5) — ${sc.themes.join(', ')}`;
    csat = {
      score: sc.score,
      verbatim: sc.verbatim,
      sentiment: sc.score >= 4 ? 'pos' : sc.score === 3 ? 'neu' : 'neg',
      themes: sc.themes,
    };
    rubric = []; // CSAT doesn't use rubric
  } else if (channel === 'call') {
    if (args.richCallIdx >= 0) {
      const sc = CALL_SCENARIOS[args.richCallIdx]!;
      summary = sc.summary;
      transcript = sc.turns.map((t, i) => ({
        id: `t-${evalId}-${i}`,
        speaker: t.speaker,
        text: t.text,
        timestampMs: t.ms,
      }));
      evidence = sc.turns
        .map((t, i) => {
          if (!t.criterionId) return null;
          return {
            id: `ev-${evalId}-${i}`,
            text: t.text,
            speaker: t.speaker,
            startMs: t.ms,
            criterionId: t.criterionId,
          } as EvidenceQuote;
        })
        .filter(Boolean) as EvidenceQuote[];
      category = sc.category;
      queue = sc.queue;
      // attach evidence ids back to criteria
      rubric = attachEvidence(rubric, evidence);
    } else {
      summary = rng.pick(SHORT_SUMMARIES.call);
      // brief 2-turn transcript
      transcript = [
        { id: `t-${evalId}-0`, speaker: 'agent', text: `Thank you for calling HR4U. ${rng.pick(['How may I help today?', 'My name is ' + agent.name.split(' ')[0] + '.', 'Can I have your associate ID, please?'])}`, timestampMs: 0 },
        { id: `t-${evalId}-1`, speaker: 'customer', text: 'Hi, ' + summary.replace(/^Caller /, '').replace(/\.$/, '') + '.', timestampMs: 4000 },
      ];
    }
  } else if (channel === 'email' || channel === 'portal') {
    const pool = channel === 'email' ? EMAIL_SCENARIOS : PORTAL_SCENARIOS;
    const richIdx = channel === 'email' ? args.richEmailIdx : args.richPortalIdx;
    if (richIdx >= 0) {
      const sc = pool[richIdx]!;
      summary = sc.summary;
      emailBody = (sc.body ?? []).map((b) => b.paragraph).join('\n\n');
      evidence = (sc.body ?? [])
        .map((b, i) => {
          if (!b.criterionId) return null;
          let charStart = 0;
          for (let j = 0; j < i; j++) charStart += (sc.body?.[j]?.paragraph.length ?? 0) + 2;
          return {
            id: `ev-${evalId}-${i}`,
            text: b.paragraph,
            charStart,
            criterionId: b.criterionId,
          } as EvidenceQuote;
        })
        .filter(Boolean) as EvidenceQuote[];
      category = sc.category;
      rubric = attachEvidence(rubric, evidence);
    } else {
      summary = rng.pick(SHORT_SUMMARIES[channel]!);
      emailBody = `Hi ${rng.pick(['Alex', 'Sam', 'Jordan', 'Casey', 'Riley', 'Morgan', 'Drew', 'Avery'])},\n\n${summary} I have logged this exchange under ${hrcCaseNumber} for your records.\n\nLet me know if you have any other questions.\n\nBest,\n${agent.name}\nHR4U`;
    }
  } else if (channel === 'chat') {
    if (args.richChatIdx >= 0) {
      const sc = CHAT_SCENARIOS[args.richChatIdx]!;
      summary = sc.summary;
      transcript = (sc.turns ?? []).map((t, i) => ({
        id: `t-${evalId}-${i}`,
        speaker: t.speaker,
        text: t.text,
        timestampMs: t.ms,
      }));
      evidence = (sc.turns ?? [])
        .map((t, i) => {
          if (!t.criterionId) return null;
          return {
            id: `ev-${evalId}-${i}`,
            text: t.text,
            speaker: t.speaker,
            startMs: t.ms,
            criterionId: t.criterionId,
          } as EvidenceQuote;
        })
        .filter(Boolean) as EvidenceQuote[];
      category = sc.category;
      rubric = attachEvidence(rubric, evidence);
    } else {
      summary = rng.pick(SHORT_SUMMARIES.chat);
      transcript = [
        { id: `t-${evalId}-0`, speaker: 'customer', text: 'hi, ' + summary.toLowerCase(), timestampMs: 0 },
        { id: `t-${evalId}-1`, speaker: 'agent', text: 'Hi! Happy to help with that. Can you confirm your associate ID?', timestampMs: 8000 },
        { id: `t-${evalId}-2`, speaker: 'customer', text: rng.int(1000, 9999) + '-' + rng.int(1000, 9999), timestampMs: 14000 },
        { id: `t-${evalId}-3`, speaker: 'agent', text: 'Thanks — verified. ' + summary, timestampMs: 18000 },
      ];
    }
  }

  // Score the rubric: weighted distribution toward pass
  rubric = rubric.map((s) => scoreSection(s, rng, channel));

  // Snapshot agent attributes at the time of the interaction (so historical
  // evals don't shift if the agent later transitions out of nesting).
  const nestingAtTime = isNestingAt(agent.trainingCompleteDate, caseDateTime);

  let evaluation: Evaluation = {
    id: evalId,
    channel,
    agentId: agent.id,
    agentName: agent.name,
    caseDateTime,
    reviewedBy: 'HRSSGC Quality Administration',
    hrcCaseNumber,
    imsCaseNumber,
    callUrl,
    summary,
    nestingAtTime,
    employmentTypeAtTime: agent.employmentType,
    vendorAtTime: agent.vendor,
    overallPct: 0,
    band: 'pass',
    aiConfidencePct: 0,
    status: 'auto_approved',
    sections: rubric,
    evidence,
    transcript,
    emailBody,
    csat,
    genesys: channel === 'call' ? {
      recordingId: `rec-${rng.int(100000, 999999)}`,
      durationSec: rng.int(120, 720),
      queue,
    } : undefined,
    servicenow: { caseId: hrcCaseNumber, category, status: rng.pick(['Resolved', 'In Progress', 'Closed']) },
    comments: [],
    flags: [],
    createdAt: caseDateTime,
  };

  // CSAT: synthesize an overall score from CSAT score
  if (channel === 'csat' && evaluation.csat) {
    evaluation.overallPct = (evaluation.csat.score / 5) * 100;
  } else {
    evaluation = recomputeEvaluation(evaluation, DEFAULT_CONFIG);
  }
  evaluation.band = evaluation.overallPct >= 90 ? 'pass' : evaluation.overallPct >= 75 ? 'needs_review' : 'fail';

  // AI confidence: cluster around 92, but ~12% low-confidence band
  const lowConf = rng.chance(0.12);
  evaluation.aiConfidencePct = lowConf
    ? rng.int(58, 79)
    : rng.int(83, 98);

  if (lowConf) evaluation.flags.push('low_confidence');

  // Random-sample flag (~5%)
  if (rng.chance(0.05)) evaluation.flags.push('random_sample');

  // PII flag (~2%)
  if (rng.chance(0.02)) {
    evaluation.flags.push('pii');
    evaluation.flags.push('exception');
  }

  // Status routing
  let status: EvaluationStatus = 'auto_approved';
  if (evaluation.flags.includes('pii')) status = 'pii_hold';
  else if (
    evaluation.aiConfidencePct < DEFAULT_CONFIG.autoApproveThresholdPct ||
    evaluation.flags.includes('random_sample')
  ) {
    status = 'pending_review';
  }
  evaluation.status = status;

  // Add a coaching comment from QA admin on a portion of needs-review/fail items
  if (
    (evaluation.band === 'needs_review' || evaluation.band === 'fail') &&
    rng.chance(0.5)
  ) {
    const admin = rng.pick(QA_ADMINS);
    const note = rng.pick([
      'Strong empathy throughout — focus next on documenting the case number before closing.',
      'Solid accuracy. Consider personalizing the closing more — repeat the customer\'s name and recap the resolution.',
      'Watch the pacing on dense policy explanations — break them up so the customer can follow.',
      'Good closing! For next call, confirm the documentation step out loud so the customer knows it\'s captured.',
    ]);
    const cmt: ReviewerComment = {
      id: `cmt-seed-${evalId}`,
      authorId: admin.id,
      authorName: admin.name,
      authorRole: 'qa_admin',
      text: note,
      at: dayjs(caseDateTime).add(1, 'day').toISOString(),
    };
    evaluation.comments.push(cmt);
  }

  return evaluation;
}

function attachEvidence(sections: RubricSection[], evidence: EvidenceQuote[]) {
  return sections.map((s) => ({
    ...s,
    criteria: s.criteria.map((c) => ({
      ...c,
      evidenceQuoteIds: evidence
        .filter((e) => e.criterionId === c.id)
        .map((e) => e.id),
    })),
  }));
}

function scoreSection(
  section: RubricSection,
  rng: Rng,
  _channel: Channel,
): RubricSection {
  // Bias toward pass: yes/full ~78%, partial 12%, no 7%, na 3%
  const sectionWeak = rng.chance(0.18);
  const criteria = section.criteria.map((c): RubricCriterion => {
    const isYesNo = c.scaleType === 'ynna';
    let value: RubricCriterion['value'];
    const r = rng.next();
    if (sectionWeak) {
      if (r < 0.45) value = isYesNo ? 'no' : 'partial';
      else if (r < 0.7) value = isYesNo ? 'no' : 'none';
      else if (r < 0.95) value = isYesNo ? 'yes' : 'full';
      else value = 'na';
    } else {
      if (r < 0.78) value = isYesNo ? 'yes' : 'full';
      else if (r < 0.9) value = isYesNo ? 'no' : 'partial';
      else if (r < 0.97) value = isYesNo ? 'no' : 'none';
      else value = 'na';
    }
    return {
      ...c,
      value,
      rationale: rationaleFor(c.label, value),
    };
  });

  const goodCount = criteria.filter((c) => c.value === 'yes' || c.value === 'full').length;
  let contribution: RubricSection['contribution'];
  const ratio = goodCount / criteria.length;
  if (ratio >= 0.95) contribution = 'exceptional';
  else if (ratio >= 0.8) contribution = 'full';
  else if (ratio >= 0.6) contribution = 'inconsistent';
  else if (ratio >= 0.4) contribution = 'learning';
  else contribution = 'attention';

  return { ...section, criteria, contribution };
}

function rationaleFor(label: string, value: string): string {
  const ok = ['full', 'yes'].includes(value);
  const partial = value === 'partial';
  const none = ['none', 'no'].includes(value);
  if (ok) return `Evidence supports the criterion: "${label}".`;
  if (partial) return `Partially met — at least one moment in the interaction did not fully demonstrate "${label}".`;
  if (none) return `Did not meet — the interaction lacks evidence of "${label}".`;
  return `Not applicable for this interaction.`;
}
