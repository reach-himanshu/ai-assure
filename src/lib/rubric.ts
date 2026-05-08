import type { Channel, ConfigState, RubricSection } from './types';

// ----- Call rubric (qualitative) -----
export function makeCallRubric(): RubricSection[] {
  return [
    {
      id: 'courteous',
      label: 'Courteous',
      criteria: [
        criterion('courteous.tone', 'Used courteous, professional tone and language', 'fpnna'),
        criterion('courteous.empathy', 'Empathized with the caller', 'fpnna'),
        criterion('courteous.engagement', 'Actively engaged with the caller', 'fpnna'),
      ],
      contribution: 'full',
      comments: '',
      sectionScorePct: 0,
    },
    {
      id: 'accurate_reliable',
      label: 'Accurate and Reliable',
      criteria: [
        criterion('accurate.info', 'Provided accurate and reliable information', 'fpnna'),
        criterion('accurate.complete', 'Provided complete, relevant information', 'fpnna'),
        criterion('accurate.documentation', 'Documentation', 'fpnna'),
        criterion('accurate.system', 'System utilization', 'fpnna'),
      ],
      contribution: 'full',
      comments: '',
      sectionScorePct: 0,
    },
    {
      id: 'call_control',
      label: 'Demonstrated Call Control / Personalized',
      criteria: [
        criterion('control.flow', 'Demonstrated call control / guided flow of call', 'fpnna'),
        criterion('control.personalized', "Personalized the caller's experience", 'fpnna'),
      ],
      contribution: 'full',
      comments: '',
      sectionScorePct: 0,
    },
    {
      id: 'requirements',
      label: 'Requirements',
      criteria: [
        criterion('requirements.greeting', 'Used appropriate greeting & validation', 'fpnna'),
        criterion('requirements.hold', 'Hold/transfer procedure', 'fpnna'),
        criterion('requirements.closing', 'Utilized standard closing', 'fpnna'),
      ],
      contribution: 'full',
      comments: '',
      sectionScorePct: 0,
    },
  ];
}

// ----- Email/Chat/Portal rubric (weighted, totals 100%) -----
export function makeWeightedRubric(): RubricSection[] {
  return [
    {
      id: 'courteous',
      label: 'Courteous',
      weightPct: 20,
      criteria: [
        criterion('courteous.tone', 'Professional language / friendly tone', 'ynna', 10),
        criterion('courteous.empathy', "Empathized with the composer's concerns", 'ynna', 10),
      ],
      contribution: 'full',
      comments: '',
      sectionScorePct: 0,
    },
    {
      id: 'accurate_reliable',
      label: 'Accurate and Reliable',
      weightPct: 40,
      criteria: [
        criterion('accurate.info', 'Provided accurate and reliable information', 'ynna', 20),
        criterion('accurate.complete', 'Provided complete and relevant information', 'ynna', 20),
      ],
      contribution: 'full',
      comments: '',
      sectionScorePct: 0,
    },
    {
      id: 'personalized',
      label: 'Personalized and Proactive',
      weightPct: 20,
      criteria: [
        criterion('personalized.address', 'Addressed composer by name / personalized', 'ynna', 10),
        criterion('personalized.guidance', 'Provided clear and concise guidance', 'ynna', 10),
      ],
      contribution: 'full',
      comments: '',
      sectionScorePct: 0,
    },
    {
      id: 'requirements',
      label: 'HR4U Required Elements',
      weightPct: 20,
      criteria: [
        criterion('requirements.auth', 'Authenticated the composer', 'ynna', 10),
        criterion('requirements.format', 'Utilized HR4U standard format / template & documentation', 'ynna', 10),
      ],
      contribution: 'full',
      comments: '',
      sectionScorePct: 0,
    },
  ];
}

function criterion(
  id: string,
  label: string,
  scaleType: 'fpnna' | 'ynna',
  weightPct?: number,
) {
  return {
    id,
    label,
    weightPct,
    scaleType,
    value: scaleType === 'fpnna' ? ('full' as const) : ('yes' as const),
    evidenceQuoteIds: [],
    rationale: '',
  };
}

export function rubricForChannel(channel: Channel): RubricSection[] {
  if (channel === 'call') return makeCallRubric();
  if (channel === 'email' || channel === 'chat' || channel === 'portal') {
    return makeWeightedRubric();
  }
  return []; // CSAT has no rubric
}

export const DEFAULT_CONFIG: ConfigState = {
  autoApproveThresholdPct: 92,
  lowConfidenceThresholdPct: 80,
  samplingPct: 5,
  passBandPct: 90,
  needsReviewFloorPct: 75,
  appealWindowDays: 7,
  weights: {
    email: {
      sectionWeights: {
        courteous: 20,
        accurate_reliable: 40,
        personalized: 20,
        requirements: 20,
      },
      criterionWeights: {
        'courteous.tone': 10,
        'courteous.empathy': 10,
        'accurate.info': 20,
        'accurate.complete': 20,
        'personalized.address': 10,
        'personalized.guidance': 10,
        'requirements.auth': 10,
        'requirements.format': 10,
      },
    },
  },
  criterionLabels: {},
};
