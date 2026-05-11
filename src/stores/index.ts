import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AppealIconVariant,
  AppealRecord,
  AuditEntry,
  ConfigState,
  Evaluation,
  EvaluationStatus,
  LogoVariant,
  ReviewerComment,
  Role,
  RubricCriterion,
  User,
} from '@/lib/types';
import { DEFAULT_CONFIG, rubricForChannel } from '@/lib/rubric';
import { recomputeEvaluation, bandFor } from '@/lib/scoring';
import { generateSeed } from '@/data/seed';
import { isNestingAt, nowIso } from '@/lib/dates';
import type { Channel } from '@/lib/types';

// Bumping the version invalidates older persisted state. Required when the
// schema changes (e.g., evaluations gain a field) — without this, users with
// pre-bump localStorage see stale data with missing fields rendered as blanks.
// Bump alongside any breaking change to the persisted shape.
//
// v3: stopped persisting transcripts/emailBody/evidence/users — they're
// deterministic seed data, not user mutations, and persisting them was
// blowing past the 5 MB localStorage quota on some browsers.
const STORAGE_KEY = 'ai-assure-state-v3';

/**
 * Quota-safe wrapper around localStorage. If a write fails (QuotaExceededError
 * or any other reason) we drop the persisted state and continue in-memory —
 * better to lose the demo's local mutations than to blank the page.
 */
const safeStorage = {
  getItem: (name: string) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      localStorage.setItem(name, value);
    } catch (err) {
      // Most likely QuotaExceededError. Try clearing our key once and retrying;
      // if it still fails, give up silently — the app keeps working in-memory.
      try {
        localStorage.removeItem(name);
        localStorage.setItem(name, value);
      } catch {
        // eslint-disable-next-line no-console
        console.warn('[ai-assure] persistence skipped — localStorage write failed', err);
      }
    }
  },
  removeItem: (name: string) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};

interface AppState {
  bootstrapped: boolean;
  users: User[];
  evaluations: Evaluation[];
  audit: AuditEntry[];
  config: ConfigState;
  currentUserId: string | null;
  theme: 'light' | 'dark';
  textSize: 'small' | 'normal' | 'large';
  sidebarHidden: boolean;
  logoVariant: LogoVariant;
  appealIconVariant: AppealIconVariant;
  channelVolumes: Record<string, number>;
  channelMonthlyVolumes: { month: string; calls: number; emails: number; chats: number; portal: number; csat: number }[];

  // mutators
  init: () => void;
  resetDemo: () => void;
  setCurrentUser: (id: string) => void;
  toggleTheme: () => void;
  cycleTextSize: () => void;
  toggleSidebar: () => void;
  setLogoVariant: (v: LogoVariant) => void;
  setAppealIconVariant: (v: AppealIconVariant) => void;
  manualEvaluate: (evaluationId: string, opts: { startBlank: boolean; reason?: string }) => void;
  createManualEvaluation: (input: {
    channel: Channel;
    agentId: string;
    hrcCaseNumber: string;
    imsCaseNumber?: string;
    callUrl?: string;
    caseDateTime: string;
    summary: string;
    snowCategory?: string;
  }) => string;

  // evaluation actions
  fileAppeal: (
    evaluationId: string,
    payload: { reason: string; agentComment: string; attachmentName?: string },
  ) => void;
  decideAppeal: (
    appealId: string,
    payload: {
      status: 'upheld' | 'overturned' | 'partially_adjusted';
      scoreDeltaPct?: number;
      decisionNotes: string;
    },
  ) => void;
  approveEvaluation: (evaluationId: string) => void;
  approveBulk: (evaluationIds: string[]) => void;
  overrideCriterion: (
    evaluationId: string,
    sectionId: string,
    criterionId: string,
    value: RubricCriterion['value'],
  ) => void;
  addComment: (evaluationId: string, text: string) => void;

  // config actions
  updateConfig: (patch: Partial<ConfigState>) => void;
  renameCriterion: (criterionId: string, newLabel: string) => void;
  updateWeight: (
    target: { kind: 'section' | 'criterion'; id: string },
    pct: number,
  ) => void;
}

function buildInitialState(): Pick<
  AppState,
  'users' | 'evaluations' | 'audit' | 'config' | 'channelVolumes' | 'channelMonthlyVolumes'
> {
  const seed = generateSeed();
  return {
    users: seed.users,
    evaluations: seed.evaluations,
    audit: seed.audit,
    config: DEFAULT_CONFIG,
    channelVolumes: seed.channelVolumes,
    channelMonthlyVolumes: seed.channelMonthlyVolumes,
  };
}
// kept for resetDemo()

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      bootstrapped: false,
      users: [],
      evaluations: [],
      audit: [],
      config: DEFAULT_CONFIG,
      currentUserId: null,
      theme: 'light',
      textSize: 'normal',
      sidebarHidden: false,
      logoVariant: 'spark',
      appealIconVariant: 'raised-hand',
      channelVolumes: {},
      channelMonthlyVolumes: [],

      init: () => {
        const seed = generateSeed();
        if (!get().bootstrapped) {
          set({
            users: seed.users,
            evaluations: seed.evaluations,
            audit: seed.audit,
            config: DEFAULT_CONFIG,
            channelVolumes: seed.channelVolumes,
            channelMonthlyVolumes: seed.channelMonthlyVolumes,
            bootstrapped: true,
          });
          return;
        }
        // Re-attach heavy seed-only fields (transcript, emailBody, evidence,
        // genesys, callUrl, summary) onto persisted evaluations. These don't
        // change once seeded, so we strip them in partialize() to keep
        // localStorage under the 5 MB quota — and rehydrate from seed here.
        const seedById = new Map(seed.evaluations.map((e) => [e.id, e]));
        const persisted = get().evaluations;
        const merged = persisted.map((e) => {
          const fromSeed = seedById.get(e.id);
          if (!fromSeed) return e; // QA-Admin-created manual evals: keep as-is
          return {
            ...e,
            transcript: fromSeed.transcript,
            emailBody: fromSeed.emailBody,
            evidence: fromSeed.evidence,
            genesys: fromSeed.genesys,
            callUrl: fromSeed.callUrl,
            summary: e.summary || fromSeed.summary,
            // Re-attach seed-derived response time (text channels only) — keeps it
            // out of localStorage but available to the dashboards/insights.
            responseTimeMin: e.responseTimeMin ?? fromSeed.responseTimeMin,
            // re-attach evidence id refs on each criterion
            sections: e.sections.map((s, i) => ({
              ...s,
              criteria: s.criteria.map((c, j) => {
                const seedC = fromSeed.sections[i]?.criteria[j];
                return {
                  ...c,
                  // Always re-attach from seed; both fields are derivable.
                  rationale: c.rationale || seedC?.rationale || '',
                  evidenceQuoteIds: seedC?.evidenceQuoteIds ?? [],
                };
              }),
            })),
          };
        });
        // If currentUserId was persisted but somehow points to a user not in
        // the seed (e.g., an old build's id), drop it so the app shows the
        // login picker instead of crashing inside AppShell.
        const currentUserId = get().currentUserId;
        const validCurrent = currentUserId && seed.users.some((u) => u.id === currentUserId);
        set({
          users: seed.users, // users are immutable post-seed; always regenerate
          evaluations: merged,
          channelVolumes: seed.channelVolumes,
          channelMonthlyVolumes: seed.channelMonthlyVolumes,
          currentUserId: validCurrent ? currentUserId : null,
        });
      },

      resetDemo: () => {
        const initial = buildInitialState();
        set({
          ...initial,
          bootstrapped: true,
          currentUserId: null,
        });
      },

      setCurrentUser: (id) => set({ currentUserId: id }),

      toggleTheme: () => {
        const next: 'light' | 'dark' = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: next });
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', next === 'dark');
        }
      },

      cycleTextSize: () => {
        const order = ['small', 'normal', 'large'] as const;
        const cur = get().textSize;
        const next = order[(order.indexOf(cur) + 1) % order.length]!;
        set({ textSize: next });
      },

      toggleSidebar: () => set({ sidebarHidden: !get().sidebarHidden }),

      setLogoVariant: (v) => set({ logoVariant: v }),
      setAppealIconVariant: (v) => set({ appealIconVariant: v }),

      createManualEvaluation: (input) => {
        const state = get();
        const me = state.users.find((u) => u.id === state.currentUserId);
        if (!me) return '';
        const agent = state.users.find((u) => u.id === input.agentId);
        if (!agent) return '';

        // Generate a unique evaluation id; suffix MAN to flag manual origin
        const num = state.evaluations.length + 1;
        const id = `EVAL-MAN${(70_000 + num).toString().padStart(6, '0')}`;

        // Build a blank rubric for the channel — every criterion starts at N/A
        // so the QA admin scores from scratch via the existing override controls.
        const sections = rubricForChannel(input.channel).map((s) => ({
          ...s,
          criteria: s.criteria.map((c) => ({
            ...c,
            value: 'na' as const,
            rationale: 'Not yet scored.',
          })),
          sectionScorePct: 0,
          contribution: 'inconsistent' as const,
          comments: '',
        }));

        const nestingAtTime = isNestingAt(agent.trainingCompleteDate, input.caseDateTime);

        const evaluation: Evaluation = {
          id,
          channel: input.channel,
          agentId: agent.id,
          agentName: agent.name,
          caseDateTime: input.caseDateTime,
          reviewedBy: me.name,
          hrcCaseNumber: input.hrcCaseNumber,
          imsCaseNumber: input.imsCaseNumber,
          callUrl: input.callUrl,
          summary: input.summary,
          overallPct: 0,
          band: 'fail',
          aiConfidencePct: 100,
          status: 'manual_evaluated',
          createdManually: true,
          sections,
          evidence: [],
          comments: [],
          flags: [],
          createdAt: nowIso(),
          nestingAtTime,
          employmentTypeAtTime: agent.employmentType,
          vendorAtTime: agent.vendor,
          servicenow: {
            caseId: input.hrcCaseNumber,
            category: input.snowCategory ?? 'General',
            status: 'In Progress',
          },
        };

        const audit = appendAudit(state.audit, me, 'evaluation.created_manually', id, undefined, {
          channel: input.channel,
          agentId: agent.id,
        });

        set({
          evaluations: [evaluation, ...state.evaluations],
          audit,
        });
        return id;
      },

      manualEvaluate: (evaluationId, opts) => {
        const state = get();
        const me = state.users.find((u) => u.id === state.currentUserId);
        if (!me) return;
        const target = state.evaluations.find((e) => e.id === evaluationId);
        if (!target) return;

        const before = { status: target.status, overallPct: target.overallPct };

        // If "start blank", clear all criterion values to N/A and zero the score; the
        // QA admin will re-score via the existing override controls. Otherwise keep
        // current scoring as a starting point.
        let updated: Evaluation = { ...target, status: 'manual_evaluated' };
        if (opts.startBlank) {
          updated = {
            ...updated,
            sections: updated.sections.map((s) => ({
              ...s,
              criteria: s.criteria.map((c) => ({ ...c, value: 'na' as const, rationale: 'Cleared for manual re-evaluation.' })),
              sectionScorePct: 0,
              contribution: 'inconsistent' as const,
            })),
            overallPct: 0,
            band: 'fail' as const,
          };
        }

        const audit = appendAudit(state.audit, me, 'evaluation.manual_evaluate', evaluationId, before, {
          startBlank: opts.startBlank,
          reason: opts.reason,
        });

        set({
          evaluations: state.evaluations.map((e) => (e.id === evaluationId ? updated : e)),
          audit,
        });
      },

      fileAppeal: (evaluationId, payload) => {
        const state = get();
        const evalRec = state.evaluations.find((e) => e.id === evaluationId);
        if (!evalRec) return;
        const me = state.users.find((u) => u.id === state.currentUserId);
        if (!me || me.role !== 'agent') return;

        const appeal: AppealRecord = {
          id: `appeal-${Date.now()}`,
          evaluationId,
          agentId: me.id,
          filedAt: nowIso(),
          reason: payload.reason,
          agentComment: payload.agentComment,
          attachmentName: payload.attachmentName,
          status: 'open',
        };

        const audit = appendAudit(state.audit, me, 'appeal.filed', evaluationId, undefined, {
          reason: payload.reason,
        });

        set({
          evaluations: state.evaluations.map((e) =>
            e.id === evaluationId ? { ...e, appeal } : e,
          ),
          audit,
        });
      },

      decideAppeal: (appealId, payload) => {
        const state = get();
        const me = state.users.find((u) => u.id === state.currentUserId);
        if (!me) return;

        const target = state.evaluations.find((e) => e.appeal?.id === appealId);
        if (!target || !target.appeal) return;

        const before = { overallPct: target.overallPct, band: target.band, appeal: target.appeal };

        let updated: Evaluation = {
          ...target,
          appeal: {
            ...target.appeal,
            status: payload.status,
            decidedBy: me.id,
            decidedByName: me.name,
            decidedAt: nowIso(),
            scoreDeltaPct: payload.scoreDeltaPct,
            decisionNotes: payload.decisionNotes,
          },
        };

        if (payload.status !== 'upheld' && typeof payload.scoreDeltaPct === 'number') {
          const newPct = Math.max(0, Math.min(100, target.overallPct + payload.scoreDeltaPct));
          updated = {
            ...updated,
            overallPct: newPct,
          };
        }

        // overturned: bump to >= passing band
        if (payload.status === 'overturned') {
          updated = {
            ...updated,
            overallPct: Math.max(updated.overallPct, state.config.passBandPct),
          };
        }

        // Recompute band from the (possibly delta-adjusted) overallPct.
        // We intentionally do NOT recompute overallPct from rubric here — the appeal delta
        // is a deliberate override that should persist.
        const recomputed = { ...updated, band: bandFor(updated.overallPct, state.config) };

        const audit = appendAudit(state.audit, me, `appeal.${payload.status}`, target.id, before, {
          overallPct: recomputed.overallPct,
          band: recomputed.band,
          decisionNotes: payload.decisionNotes,
        });

        set({
          evaluations: state.evaluations.map((e) => (e.id === target.id ? recomputed : e)),
          audit,
        });
      },

      approveEvaluation: (evaluationId) => {
        const state = get();
        const me = state.users.find((u) => u.id === state.currentUserId);
        if (!me) return;
        const evalRec = state.evaluations.find((e) => e.id === evaluationId);
        if (!evalRec) return;

        const before = { status: evalRec.status };
        const status: EvaluationStatus = 'reviewer_approved';

        const audit = appendAudit(state.audit, me, 'evaluation.approved', evaluationId, before, {
          status,
        });

        set({
          evaluations: state.evaluations.map((e) =>
            e.id === evaluationId ? { ...e, status } : e,
          ),
          audit,
        });
      },

      approveBulk: (evaluationIds) => {
        const state = get();
        const me = state.users.find((u) => u.id === state.currentUserId);
        if (!me) return;
        const idSet = new Set(evaluationIds);
        let audit = state.audit;
        for (const id of evaluationIds) {
          audit = appendAudit(audit, me, 'evaluation.bulk_approved', id, undefined, {});
        }
        set({
          evaluations: state.evaluations.map((e) =>
            idSet.has(e.id) ? { ...e, status: 'reviewer_approved' } : e,
          ),
          audit,
        });
      },

      overrideCriterion: (evaluationId, sectionId, criterionId, value) => {
        const state = get();
        const me = state.users.find((u) => u.id === state.currentUserId);
        if (!me) return;
        const evalRec = state.evaluations.find((e) => e.id === evaluationId);
        if (!evalRec) return;

        const before = { value: evalRec.sections.find((s) => s.id === sectionId)?.criteria.find((c) => c.id === criterionId)?.value };

        const updated: Evaluation = {
          ...evalRec,
          status: 'overridden',
          sections: evalRec.sections.map((s) =>
            s.id !== sectionId
              ? s
              : {
                  ...s,
                  criteria: s.criteria.map((c) =>
                    c.id !== criterionId ? c : { ...c, value },
                  ),
                },
          ),
        };
        const recomputed = recomputeEvaluation(updated, state.config);

        const audit = appendAudit(state.audit, me, 'criterion.overridden', evaluationId, before, {
          value,
          sectionId,
          criterionId,
        });

        set({
          evaluations: state.evaluations.map((e) => (e.id === evaluationId ? recomputed : e)),
          audit,
        });
      },

      addComment: (evaluationId, text) => {
        const state = get();
        const me = state.users.find((u) => u.id === state.currentUserId);
        if (!me) return;
        const comment: ReviewerComment = {
          id: `cmt-${Date.now()}`,
          authorId: me.id,
          authorName: me.name,
          authorRole: me.role,
          text,
          at: nowIso(),
        };
        const audit = appendAudit(state.audit, me, 'evaluation.commented', evaluationId, undefined, {
          text: text.slice(0, 80),
        });
        set({
          evaluations: state.evaluations.map((e) =>
            e.id === evaluationId ? { ...e, comments: [...e.comments, comment] } : e,
          ),
          audit,
        });
      },

      updateConfig: (patch) => {
        const state = get();
        const me = state.users.find((u) => u.id === state.currentUserId);
        const before = state.config;
        const next = { ...state.config, ...patch };
        const audit = me
          ? appendAudit(state.audit, me, 'config.updated', 'config', before, next)
          : state.audit;
        set({ config: next, audit });
      },

      renameCriterion: (criterionId, newLabel) => {
        const state = get();
        const me = state.users.find((u) => u.id === state.currentUserId);
        const next = {
          ...state.config,
          criterionLabels: { ...state.config.criterionLabels, [criterionId]: newLabel },
        };
        const audit = me
          ? appendAudit(state.audit, me, 'rubric.renamed', criterionId, undefined, { newLabel })
          : state.audit;
        set({ config: next, audit });
      },

      updateWeight: ({ kind, id }, pctValue) => {
        const state = get();
        const me = state.users.find((u) => u.id === state.currentUserId);
        const w = state.config.weights.email;
        let next = state.config;
        if (kind === 'section') {
          next = {
            ...state.config,
            weights: {
              email: {
                ...w,
                sectionWeights: { ...w.sectionWeights, [id]: pctValue },
              },
            },
          };
        } else {
          next = {
            ...state.config,
            weights: {
              email: {
                ...w,
                criterionWeights: { ...w.criterionWeights, [id]: pctValue },
              },
            },
          };
        }
        const audit = me
          ? appendAudit(state.audit, me, 'rubric.weight_updated', id, undefined, { pctValue })
          : state.audit;
        set({ config: next, audit });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: {
        getItem: (name) => {
          const v = safeStorage.getItem(name);
          if (!v) return null;
          try {
            return JSON.parse(v);
          } catch {
            return null;
          }
        },
        setItem: (name, value) => safeStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => safeStorage.removeItem(name),
      },
      partialize: (s) =>
        ({
          bootstrapped: s.bootstrapped,
          // Strip heavy seed-only fields from each evaluation. Re-attached in
          // init() from the deterministic seed. Persisting these blew past the
          // localStorage quota.
          evaluations: s.evaluations.map((e) => ({
            ...e,
            transcript: undefined,
            emailBody: undefined,
            evidence: [],
            genesys: undefined,
            // Per-criterion strings (rationale ~80 chars × 12 criteria/eval × 800 evals)
            // are seed-derived and re-attached on init.
            sections: e.sections.map((sec) => ({
              ...sec,
              criteria: sec.criteria.map((c) => ({
                ...c,
                rationale: '',
                evidenceQuoteIds: [],
              })),
            })),
          })),
          audit: s.audit,
          config: s.config,
          currentUserId: s.currentUserId,
          theme: s.theme,
          textSize: s.textSize,
          sidebarHidden: s.sidebarHidden,
          logoVariant: s.logoVariant,
          appealIconVariant: s.appealIconVariant,
          // users + channelVolumes are seed-derived; don't persist
        }) as unknown as AppState,
    },
  ),
);

function appendAudit(
  list: AuditEntry[],
  actor: { id: string; name: string; role: Role },
  action: string,
  targetId: string,
  before?: unknown,
  after?: unknown,
): AuditEntry[] {
  return [
    ...list,
    {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      at: nowIso(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action,
      targetId,
      before,
      after,
    },
  ];
}

// ----- Selectors / hooks -----
export function useCurrentUser(): User | null {
  return useApp((s) => s.users.find((u) => u.id === s.currentUserId) ?? null);
}

export function useVisibleEvaluations(): Evaluation[] {
  // Atomic selectors return stable refs; the filter is memoized in React land
  // to avoid feeding a fresh array into useSyncExternalStore on every render.
  const evaluations = useApp((s) => s.evaluations);
  const users = useApp((s) => s.users);
  const currentUserId = useApp((s) => s.currentUserId);
  return useMemo(() => {
    const me = users.find((u) => u.id === currentUserId);
    if (!me) return evaluations;
    if (me.role === 'agent') {
      return evaluations.filter((e) => e.agentId === me.id);
    }
    if (me.role === 'supervisor') {
      const teamAgents = new Set(
        users.filter((u) => u.supervisorId === me.id).map((u) => u.id),
      );
      return evaluations.filter((e) => teamAgents.has(e.agentId));
    }
    return evaluations;
  }, [evaluations, users, currentUserId]);
}
