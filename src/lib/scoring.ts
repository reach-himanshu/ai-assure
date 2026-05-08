import type {
  Band,
  ConfigState,
  Evaluation,
  RubricCriterion,
  RubricSection,
} from './types';

const VALUE_TO_NUMERIC: Record<string, number | null> = {
  full: 100,
  partial: 50,
  none: 0,
  yes: 100,
  no: 0,
  na: null,
};

export function criterionScorePct(c: RubricCriterion): number | null {
  return VALUE_TO_NUMERIC[c.value] ?? null;
}

export function sectionScorePct(section: RubricSection): number {
  const totalWeight = section.criteria.reduce((s, c) => s + (c.weightPct ?? 0), 0);
  // weighted (email/chat/portal): use criterion weights
  if (totalWeight > 0) {
    let sum = 0;
    let usedWeight = 0;
    for (const c of section.criteria) {
      const score = criterionScorePct(c);
      if (score === null) continue;
      const w = c.weightPct ?? 0;
      sum += score * w;
      usedWeight += w;
    }
    return usedWeight === 0 ? 0 : sum / usedWeight;
  }
  // unweighted (call): equal-weighted average of scored criteria
  const scored = section.criteria
    .map(criterionScorePct)
    .filter((v): v is number => v !== null);
  if (scored.length === 0) return 0;
  return scored.reduce((s, v) => s + v, 0) / scored.length;
}

export function overallScorePct(sections: RubricSection[]): number {
  const totalWeight = sections.reduce((s, sec) => s + (sec.weightPct ?? 0), 0);
  if (totalWeight > 0) {
    return (
      sections.reduce(
        (s, sec) => s + sectionScorePct(sec) * (sec.weightPct ?? 0),
        0,
      ) / totalWeight
    );
  }
  // unweighted (call): equal-weighted average of section scores
  if (sections.length === 0) return 0;
  return sections.reduce((s, sec) => s + sectionScorePct(sec), 0) / sections.length;
}

export function bandFor(pct: number, cfg: ConfigState): Band {
  if (pct >= cfg.passBandPct) return 'pass';
  if (pct >= cfg.needsReviewFloorPct) return 'needs_review';
  return 'fail';
}

export function recomputeEvaluation(
  evalRec: Evaluation,
  cfg: ConfigState,
): Evaluation {
  const sections = evalRec.sections.map((s) => ({
    ...s,
    sectionScorePct: sectionScorePct(s),
  }));
  const overall = overallScorePct(sections);
  return {
    ...evalRec,
    sections,
    overallPct: overall,
    band: bandFor(overall, cfg),
  };
}
