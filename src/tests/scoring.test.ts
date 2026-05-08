import { describe, expect, it } from 'vitest';
import { bandFor, criterionScorePct, sectionScorePct, overallScorePct } from '@/lib/scoring';
import { DEFAULT_CONFIG, makeWeightedRubric, makeCallRubric } from '@/lib/rubric';

describe('scoring', () => {
  it('maps criterion values to numeric scores', () => {
    expect(criterionScorePct({ id: 'x', label: 'x', scaleType: 'fpnna', value: 'full', evidenceQuoteIds: [], rationale: '' })).toBe(100);
    expect(criterionScorePct({ id: 'x', label: 'x', scaleType: 'fpnna', value: 'partial', evidenceQuoteIds: [], rationale: '' })).toBe(50);
    expect(criterionScorePct({ id: 'x', label: 'x', scaleType: 'fpnna', value: 'none', evidenceQuoteIds: [], rationale: '' })).toBe(0);
    expect(criterionScorePct({ id: 'x', label: 'x', scaleType: 'fpnna', value: 'na', evidenceQuoteIds: [], rationale: '' })).toBeNull();
    expect(criterionScorePct({ id: 'x', label: 'x', scaleType: 'ynna', value: 'yes', evidenceQuoteIds: [], rationale: '' })).toBe(100);
    expect(criterionScorePct({ id: 'x', label: 'x', scaleType: 'ynna', value: 'no', evidenceQuoteIds: [], rationale: '' })).toBe(0);
  });

  it('weighted email rubric: all yes → 100%', () => {
    const sections = makeWeightedRubric();
    sections.forEach((s) => s.criteria.forEach((c) => (c.value = 'yes')));
    expect(overallScorePct(sections)).toBe(100);
  });

  it('weighted email rubric: zero info → score reflects 60% drop', () => {
    const sections = makeWeightedRubric();
    sections.forEach((s) => s.criteria.forEach((c) => (c.value = 'yes')));
    // Mark "Accurate and Reliable" criteria all as no (40% of total weight)
    const accurate = sections.find((s) => s.id === 'accurate_reliable')!;
    accurate.criteria.forEach((c) => (c.value = 'no'));
    const overall = overallScorePct(sections);
    expect(overall).toBe(60);
  });

  it('call rubric: equal section weighting, 100 when all full', () => {
    const sections = makeCallRubric();
    sections.forEach((s) => s.criteria.forEach((c) => (c.value = 'full')));
    expect(overallScorePct(sections)).toBe(100);
  });

  it('call rubric: partial values reduce section score appropriately', () => {
    const sections = makeCallRubric();
    sections.forEach((s) => s.criteria.forEach((c) => (c.value = 'full')));
    const courteous = sections.find((s) => s.id === 'courteous')!;
    courteous.criteria[0]!.value = 'partial';
    courteous.criteria[1]!.value = 'none';
    expect(sectionScorePct(courteous)).toBeCloseTo((100 + 50 + 0) / 3, 1);
  });

  it('N/A criteria are excluded from the average', () => {
    const sections = makeWeightedRubric();
    const courteous = sections.find((s) => s.id === 'courteous')!;
    courteous.criteria[0]!.value = 'na';
    courteous.criteria[1]!.value = 'yes';
    expect(sectionScorePct(courteous)).toBe(100);
  });

  it('bandFor: 90 = pass, 75 = needs_review, 74 = fail', () => {
    expect(bandFor(90, DEFAULT_CONFIG)).toBe('pass');
    expect(bandFor(89, DEFAULT_CONFIG)).toBe('needs_review');
    expect(bandFor(75, DEFAULT_CONFIG)).toBe('needs_review');
    expect(bandFor(74, DEFAULT_CONFIG)).toBe('fail');
  });
});
