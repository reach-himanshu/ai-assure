import { describe, expect, it, beforeEach } from 'vitest';
import { useApp } from '@/stores';
import { AGENTS, SUPERVISORS } from '@/data/people';

describe('appeal state machine', () => {
  beforeEach(() => {
    localStorage.clear();
    useApp.getState().resetDemo();
  });

  it('agent files an appeal and supervisor partially adjusts the score', () => {
    const state = useApp.getState();
    const agent = AGENTS[0]!;
    const supervisor = SUPERVISORS.find((s) => s.id === agent.supervisorId)!;
    // pick an evaluation owned by agent that does not currently have an appeal
    const target = state.evaluations.find((e) => e.agentId === agent.id && !e.appeal);
    expect(target).toBeDefined();

    // become the agent
    useApp.getState().setCurrentUser(agent.id);
    useApp.getState().fileAppeal(target!.id, {
      reason: 'Evidence does not support the criterion scoring.',
      agentComment: 'Please re-review section X.',
    });
    const afterFile = useApp.getState().evaluations.find((e) => e.id === target!.id)!;
    expect(afterFile.appeal?.status).toBe('open');
    expect(afterFile.appeal?.agentId).toBe(agent.id);

    // become the supervisor and decide
    useApp.getState().setCurrentUser(supervisor.id);
    const beforeScore = afterFile.overallPct;
    useApp.getState().decideAppeal(afterFile.appeal!.id, {
      status: 'partially_adjusted',
      scoreDeltaPct: 6,
      decisionNotes: 'Partial adjustment — evidence partially supports the appeal.',
    });
    const afterDecide = useApp.getState().evaluations.find((e) => e.id === target!.id)!;
    expect(afterDecide.appeal?.status).toBe('partially_adjusted');
    expect(afterDecide.appeal?.decidedBy).toBe(supervisor.id);
    expect(afterDecide.overallPct).toBeCloseTo(Math.min(100, beforeScore + 6), 0);
  });

  it('overturning bumps score to passing band', () => {
    const state = useApp.getState();
    const agent = AGENTS[0]!;
    const supervisor = SUPERVISORS.find((s) => s.id === agent.supervisorId)!;
    const target = state.evaluations.find((e) => e.agentId === agent.id && !e.appeal && e.band !== 'pass');
    if (!target) return; // skip if no candidates

    useApp.getState().setCurrentUser(agent.id);
    useApp.getState().fileAppeal(target.id, { reason: 'r', agentComment: 'c' });

    useApp.getState().setCurrentUser(supervisor.id);
    const after = useApp.getState().evaluations.find((e) => e.id === target.id)!;
    useApp.getState().decideAppeal(after.appeal!.id, { status: 'overturned', decisionNotes: 'agreed' });

    const final = useApp.getState().evaluations.find((e) => e.id === target.id)!;
    expect(final.overallPct).toBeGreaterThanOrEqual(useApp.getState().config.passBandPct);
    expect(final.appeal?.status).toBe('overturned');
  });

  it('audit log captures appeal lifecycle', () => {
    const state = useApp.getState();
    const agent = AGENTS[1]!;
    const supervisor = SUPERVISORS.find((s) => s.id === agent.supervisorId)!;
    const target = state.evaluations.find((e) => e.agentId === agent.id && !e.appeal)!;
    const auditBefore = useApp.getState().audit.length;

    useApp.getState().setCurrentUser(agent.id);
    useApp.getState().fileAppeal(target.id, { reason: 'r', agentComment: 'c' });
    useApp.getState().setCurrentUser(supervisor.id);
    const after = useApp.getState().evaluations.find((e) => e.id === target.id)!;
    useApp.getState().decideAppeal(after.appeal!.id, { status: 'upheld', decisionNotes: 'stands' });

    const auditAfter = useApp.getState().audit.length;
    expect(auditAfter - auditBefore).toBe(2);
  });
});
