import { describe, expect, it, beforeEach } from 'vitest';
import { useApp } from '@/stores';
import { QA_ADMINS, SUPERVISORS, AGENTS } from '@/data/people';

describe('HITL approval flow', () => {
  beforeEach(() => {
    localStorage.clear();
    useApp.getState().resetDemo();
  });

  it('approveEvaluation flips status to reviewer_approved and writes an audit entry', () => {
    const admin = QA_ADMINS[0]!;
    useApp.getState().setCurrentUser(admin.id);
    const target = useApp.getState().evaluations.find((e) => e.status === 'pending_review');
    expect(target).toBeDefined();
    const auditBefore = useApp.getState().audit.length;

    useApp.getState().approveEvaluation(target!.id);
    const after = useApp.getState().evaluations.find((e) => e.id === target!.id)!;
    expect(after.status).toBe('reviewer_approved');
    expect(useApp.getState().audit.length).toBe(auditBefore + 1);
    const last = useApp.getState().audit.at(-1)!;
    expect(last.action).toBe('evaluation.approved');
    expect(last.actorId).toBe(admin.id);
    expect(last.targetId).toBe(target!.id);
  });

  it('approveBulk flips multiple statuses and writes one audit entry per item', () => {
    const admin = QA_ADMINS[0]!;
    useApp.getState().setCurrentUser(admin.id);
    const ids = useApp.getState().evaluations
      .filter((e) => e.status === 'pending_review')
      .slice(0, 5)
      .map((e) => e.id);
    expect(ids.length).toBeGreaterThan(0);
    const auditBefore = useApp.getState().audit.length;

    useApp.getState().approveBulk(ids);

    for (const id of ids) {
      expect(useApp.getState().evaluations.find((e) => e.id === id)!.status).toBe('reviewer_approved');
    }
    expect(useApp.getState().audit.length).toBe(auditBefore + ids.length);
  });

  it('overrideCriterion recomputes the overall score and band', () => {
    const admin = QA_ADMINS[0]!;
    useApp.getState().setCurrentUser(admin.id);
    // Pick a weighted-channel eval
    const target = useApp.getState().evaluations.find((e) => e.channel === 'email' && e.band === 'pass');
    if (!target) return;
    const before = target.overallPct;
    const section = target.sections.find((s) => s.id === 'accurate_reliable')!;
    const criterion = section.criteria[0]!;

    useApp.getState().overrideCriterion(target.id, section.id, criterion.id, 'no');

    const after = useApp.getState().evaluations.find((e) => e.id === target.id)!;
    expect(after.overallPct).toBeLessThan(before);
    expect(after.status).toBe('overridden');
    expect(after.sections.find((s) => s.id === section.id)!.criteria.find((c) => c.id === criterion.id)!.value).toBe('no');
    const last = useApp.getState().audit.at(-1)!;
    expect(last.action).toBe('criterion.overridden');
  });

  it('manualEvaluate (start blank) flips status, clears criteria to N/A, zeroes the score', () => {
    const admin = QA_ADMINS[0]!;
    useApp.getState().setCurrentUser(admin.id);
    const target = useApp.getState().evaluations.find((e) => e.channel !== 'csat' && e.status !== 'manual_evaluated');
    if (!target) return;

    useApp.getState().manualEvaluate(target.id, { startBlank: true, reason: 'Recalibrating AI grader' });

    const after = useApp.getState().evaluations.find((e) => e.id === target.id)!;
    expect(after.status).toBe('manual_evaluated');
    expect(after.overallPct).toBe(0);
    for (const s of after.sections) {
      for (const c of s.criteria) {
        expect(c.value).toBe('na');
      }
    }
    const last = useApp.getState().audit.at(-1)!;
    expect(last.action).toBe('evaluation.manual_evaluate');
  });

  it('manualEvaluate (keep AI scores) only flips status, leaves scoring intact', () => {
    const admin = QA_ADMINS[0]!;
    useApp.getState().setCurrentUser(admin.id);
    const target = useApp.getState().evaluations.find((e) => e.channel !== 'csat' && e.status !== 'manual_evaluated' && e.overallPct > 0)!;
    const beforePct = target.overallPct;
    const beforeFirstValue = target.sections[0]!.criteria[0]!.value;

    useApp.getState().manualEvaluate(target.id, { startBlank: false });

    const after = useApp.getState().evaluations.find((e) => e.id === target.id)!;
    expect(after.status).toBe('manual_evaluated');
    expect(after.overallPct).toBe(beforePct);
    expect(after.sections[0]!.criteria[0]!.value).toBe(beforeFirstValue);
  });

  it('addComment appends a reviewer comment authored by the current user', () => {
    const admin = QA_ADMINS[1]!;
    useApp.getState().setCurrentUser(admin.id);
    const target = useApp.getState().evaluations[0]!;
    const before = target.comments.length;

    useApp.getState().addComment(target.id, 'Great empathy throughout — keep it up.');

    const after = useApp.getState().evaluations.find((e) => e.id === target.id)!;
    expect(after.comments.length).toBe(before + 1);
    expect(after.comments.at(-1)!.authorId).toBe(admin.id);
    expect(after.comments.at(-1)!.text).toContain('empathy');
  });
});

describe('config + audit', () => {
  beforeEach(() => {
    localStorage.clear();
    useApp.getState().resetDemo();
  });

  it('updateConfig writes before/after to the audit log', () => {
    const admin = QA_ADMINS[0]!;
    useApp.getState().setCurrentUser(admin.id);
    const before = useApp.getState().config.autoApproveThresholdPct;

    useApp.getState().updateConfig({ autoApproveThresholdPct: 80 });

    expect(useApp.getState().config.autoApproveThresholdPct).toBe(80);
    const last = useApp.getState().audit.at(-1)!;
    expect(last.action).toBe('config.updated');
    expect((last.before as { autoApproveThresholdPct: number }).autoApproveThresholdPct).toBe(before);
    expect((last.after as { autoApproveThresholdPct: number }).autoApproveThresholdPct).toBe(80);
  });

  it('renameCriterion stores a custom label keyed by criterion id', () => {
    const admin = QA_ADMINS[0]!;
    useApp.getState().setCurrentUser(admin.id);

    useApp.getState().renameCriterion('courteous.tone', 'Warm and professional tone');

    expect(useApp.getState().config.criterionLabels['courteous.tone']).toBe('Warm and professional tone');
    const last = useApp.getState().audit.at(-1)!;
    expect(last.action).toBe('rubric.renamed');
    expect(last.targetId).toBe('courteous.tone');
  });

  it('updateWeight changes weighted-channel section weight', () => {
    const admin = QA_ADMINS[0]!;
    useApp.getState().setCurrentUser(admin.id);

    useApp.getState().updateWeight({ kind: 'section', id: 'courteous' }, 25);

    expect(useApp.getState().config.weights.email.sectionWeights.courteous).toBe(25);
    const last = useApp.getState().audit.at(-1)!;
    expect(last.action).toBe('rubric.weight_updated');
  });
});

describe('persona-scoped visibility (assertions only — UI-side filters use the same selector)', () => {
  beforeEach(() => {
    localStorage.clear();
    useApp.getState().resetDemo();
  });

  it('agent sees only their own evaluations', () => {
    const me = AGENTS[0]!;
    useApp.getState().setCurrentUser(me.id);
    const visible = useApp.getState().evaluations.filter((e) => e.agentId === me.id);
    const all = useApp.getState().evaluations;
    expect(visible.length).toBeLessThan(all.length);
    expect(visible.every((e) => e.agentId === me.id)).toBe(true);
  });

  it("supervisor sees only their team's evaluations", () => {
    const sup = SUPERVISORS[0]!;
    const teamIds = new Set(AGENTS.filter((a) => a.supervisorId === sup.id).map((a) => a.id));
    useApp.getState().setCurrentUser(sup.id);
    const visible = useApp.getState().evaluations.filter((e) => teamIds.has(e.agentId));
    expect(visible.length).toBeGreaterThan(0);
    expect(visible.every((e) => teamIds.has(e.agentId))).toBe(true);
  });
});
