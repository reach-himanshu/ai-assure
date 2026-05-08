import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AppealRecord,
  AuditEntry,
  ConfigState,
  Evaluation,
  EvaluationStatus,
  ReviewerComment,
  Role,
  RubricCriterion,
  User,
} from '@/lib/types';
import { DEFAULT_CONFIG } from '@/lib/rubric';
import { recomputeEvaluation, bandFor } from '@/lib/scoring';
import { generateSeed } from '@/data/seed';
import { nowIso } from '@/lib/dates';

const STORAGE_KEY = 'ai-assure-state-v1';

interface AppState {
  bootstrapped: boolean;
  users: User[];
  evaluations: Evaluation[];
  audit: AuditEntry[];
  config: ConfigState;
  currentUserId: string | null;
  theme: 'light' | 'dark';
  channelVolumes: Record<string, number>;
  channelMonthlyVolumes: { month: string; calls: number; emails: number; chats: number; portal: number; csat: number }[];

  // mutators
  init: () => void;
  resetDemo: () => void;
  setCurrentUser: (id: string) => void;
  toggleTheme: () => void;

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
      channelVolumes: {},
      channelMonthlyVolumes: [],

      init: () => {
        if (get().bootstrapped) return;
        const initial = buildInitialState();
        set({ ...initial, bootstrapped: true });
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
      partialize: (s) => ({
        bootstrapped: s.bootstrapped,
        users: s.users,
        evaluations: s.evaluations,
        audit: s.audit,
        config: s.config,
        currentUserId: s.currentUserId,
        theme: s.theme,
        channelVolumes: s.channelVolumes,
        channelMonthlyVolumes: s.channelMonthlyVolumes,
      }),
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
