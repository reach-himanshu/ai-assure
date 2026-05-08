import { useState } from 'react';
import { useApp } from '@/stores';
import { useToast } from '@/components/Toast';
import clsx from 'clsx';
import { fromNow } from '@/lib/dates';
import { makeWeightedRubric } from '@/lib/rubric';
import type { ConfigState } from '@/lib/types';
import { BrandingTab } from './BrandingTab';

export function AdminConsole() {
  const config = useApp((s) => s.config);
  const updateConfig = useApp((s) => s.updateConfig);
  const renameCriterion = useApp((s) => s.renameCriterion);
  const updateWeight = useApp((s) => s.updateWeight);
  const audit = useApp((s) => s.audit);
  const toast = useToast();

  const [tab, setTab] = useState<'thresholds' | 'rubric' | 'branding' | 'audit'>('thresholds');

  return (
    <div>
      <div className="mb-5 flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl">Configuration</h1>
          <p className="text-sm text-ink-muted mt-1">Edit thresholds and rubrics. Changes affect new evaluations only.</p>
        </div>
        <div className="card-tight inline-flex items-center gap-1 p-1">
          <TabBtn active={tab === 'thresholds'} onClick={() => setTab('thresholds')}>Thresholds</TabBtn>
          <TabBtn active={tab === 'rubric'} onClick={() => setTab('rubric')}>Rubric editor</TabBtn>
          <TabBtn active={tab === 'branding'} onClick={() => setTab('branding')}>Branding</TabBtn>
          <TabBtn active={tab === 'audit'} onClick={() => setTab('audit')}>Audit log</TabBtn>
        </div>
      </div>

      {tab === 'thresholds' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ThresholdCard
            label="Auto-approve confidence"
            help="Above this AI confidence, evaluations skip human review."
            min={50}
            max={99}
            value={config.autoApproveThresholdPct}
            onChange={(v) => { updateConfig({ autoApproveThresholdPct: v }); toast(`Auto-approve threshold set to ${v}%.`, 'success'); }}
            unit="%"
          />
          <ThresholdCard
            label="Low-confidence cutoff"
            help="Items below this confidence land in the low-confidence reviewer queue."
            min={50}
            max={95}
            value={config.lowConfidenceThresholdPct}
            onChange={(v) => { updateConfig({ lowConfidenceThresholdPct: v }); toast(`Low-confidence cutoff set to ${v}%.`, 'success'); }}
            unit="%"
          />
          <ThresholdCard
            label="Random sampling rate"
            help="Percentage of auto-approved items pulled into review for QA assurance."
            min={0}
            max={25}
            step={1}
            value={config.samplingPct}
            onChange={(v) => { updateConfig({ samplingPct: v }); toast(`Random sampling rate set to ${v}%.`, 'success'); }}
            unit="%"
          />
          <ThresholdCard
            label="Pass band"
            help="Score at or above this is considered passing."
            min={70}
            max={100}
            step={1}
            value={config.passBandPct}
            onChange={(v) => { updateConfig({ passBandPct: v }); toast(`Pass band set to ${v}%.`, 'success'); }}
            unit="%"
          />
          <ThresholdCard
            label="Needs-review floor"
            help="Below this score, the evaluation is marked Fail and the agent's supervisor is notified."
            min={50}
            max={90}
            step={1}
            value={config.needsReviewFloorPct}
            onChange={(v) => { updateConfig({ needsReviewFloorPct: v }); toast(`Needs-review floor set to ${v}%.`, 'success'); }}
            unit="%"
          />
          <ThresholdCard
            label="Appeal window"
            help="Number of days an agent has to file an appeal after their interaction."
            min={1}
            max={30}
            step={1}
            value={config.appealWindowDays}
            onChange={(v) => { updateConfig({ appealWindowDays: v }); toast(`Appeal window set to ${v} days.`, 'success'); }}
            unit=" days"
          />
        </div>
      )}

      {tab === 'rubric' && <RubricEditor config={config} renameCriterion={renameCriterion} updateWeight={updateWeight} />}

      {tab === 'branding' && <BrandingTab />}

      {tab === 'audit' && (
        <div className="card">
          <header className="mb-4">
            <h2 className="text-lg">Audit log</h2>
            <p className="text-sm text-ink-muted">Every config change, decision, and override.</p>
          </header>
          <ul className="space-y-3">
            {[...audit].reverse().map((a) => (
              <li key={a.id} className="border-l-2 border-brand-500 pl-4 py-1">
                <p className="text-sm">
                  <span className="font-semibold">{a.actorName}</span> · {a.action.replace(/[._]/g, ' ')} · <span className="font-mono text-xs text-ink-muted">{a.targetId}</span>
                </p>
                <p className="text-xs text-ink-muted">{fromNow(a.at)} · {a.actorRole.replace('_', ' ')}</p>
              </li>
            ))}
            {audit.length === 0 && <p className="text-sm text-ink-muted text-center py-6">No audit events yet.</p>}
          </ul>
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition', active ? 'bg-brand-600 text-white' : 'text-ink-muted hover:bg-surface-alt dark:hover:bg-surface-dark')}>
      {children}
    </button>
  );
}

interface ThresholdProps {
  label: string;
  help: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  unit: string;
}
function ThresholdCard({ label, help, min, max, step = 1, value, onChange, unit }: ThresholdProps) {
  const [local, setLocal] = useState(value);
  return (
    <div className="card">
      <header className="mb-3">
        <h3 className="text-base font-semibold">{label}</h3>
        <p className="text-xs text-ink-muted mt-1">{help}</p>
      </header>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-4xl font-semibold tabular-nums">{local}{unit}</span>
        <span className="text-xs text-ink-muted">range {min}–{max}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={local}
        onChange={(e) => setLocal(parseInt(e.target.value, 10))}
        onMouseUp={() => onChange(local)}
        onTouchEnd={() => onChange(local)}
        className="w-full accent-brand-600"
      />
    </div>
  );
}

function RubricEditor({
  config,
  renameCriterion,
  updateWeight,
}: {
  config: ConfigState;
  renameCriterion: (id: string, label: string) => void;
  updateWeight: (target: { kind: 'section' | 'criterion'; id: string }, pct: number) => void;
}) {
  const baseSections = makeWeightedRubric();

  const sectionsTotal = baseSections.reduce(
    (s, sec) => s + (config.weights.email.sectionWeights[sec.id] ?? sec.weightPct ?? 0),
    0,
  );
  const sectionsValid = sectionsTotal === 100;

  return (
    <div className="space-y-5">
      <div className={clsx('card-tight flex items-center gap-3', sectionsValid ? 'border-band-pass/30 bg-band-pass/5' : 'border-band-fail/30 bg-band-fail/5')}>
        <span className={sectionsValid ? 'text-band-pass' : 'text-band-fail'}>
          {sectionsValid ? '✓' : '!'}
        </span>
        <p className="text-sm">
          <span className="font-semibold">Email/Chat/Portal sections total: {sectionsTotal}%</span>
          {!sectionsValid && <> — must equal 100% before applying.</>}
        </p>
      </div>

      <div className="card">
        <header className="mb-4">
          <h2 className="text-lg">Email · Chat · Portal rubric</h2>
          <p className="text-sm text-ink-muted">Edit weights and criterion labels. Call rubric is qualitative — see below.</p>
        </header>
        <div className="space-y-4">
          {baseSections.map((s) => {
            const sw = config.weights.email.sectionWeights[s.id] ?? s.weightPct ?? 0;
            return (
              <div key={s.id} className="rounded-xl border border-line dark:border-line-dark p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="font-semibold">{s.label}</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={sw}
                      onChange={(e) => updateWeight({ kind: 'section', id: s.id }, parseInt(e.target.value || '0', 10))}
                      className="input w-20 text-right"
                    />
                    <span className="text-sm text-ink-muted">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {s.criteria.map((c) => {
                    const cw = config.weights.email.criterionWeights[c.id] ?? c.weightPct ?? 0;
                    const customLabel = config.criterionLabels[c.id];
                    return (
                      <div key={c.id} className="grid grid-cols-12 gap-2 items-center">
                        <input
                          type="text"
                          defaultValue={customLabel ?? c.label}
                          onBlur={(e) => {
                            if (e.target.value !== c.label && e.target.value.trim()) {
                              renameCriterion(c.id, e.target.value.trim());
                            }
                          }}
                          className="input col-span-9 text-sm"
                        />
                        <input
                          type="number"
                          value={cw}
                          onChange={(e) => updateWeight({ kind: 'criterion', id: c.id }, parseInt(e.target.value || '0', 10))}
                          className="input col-span-2 text-right text-sm"
                        />
                        <span className="text-xs text-ink-muted col-span-1">%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <header className="mb-3">
          <h2 className="text-lg">Call rubric</h2>
          <p className="text-sm text-ink-muted">Qualitative — Full / Partial / None / N/A per criterion. Section weights are equal by default.</p>
        </header>
        <ul className="text-sm divide-y divide-line dark:divide-line-dark">
          {[
            { label: 'Courteous', items: ['Used courteous, professional tone and language', 'Empathized with the caller', 'Actively engaged with the caller'] },
            { label: 'Accurate and Reliable', items: ['Provided accurate and reliable information', 'Provided complete, relevant information', 'Documentation', 'System utilization'] },
            { label: 'Demonstrated Call Control / Personalized', items: ['Demonstrated call control / guided flow of call', "Personalized the caller's experience"] },
            { label: 'Requirements', items: ['Used appropriate greeting & validation', 'Hold/transfer procedure', 'Utilized standard closing'] },
          ].map((sec) => (
            <li key={sec.label} className="py-3">
              <p className="font-semibold mb-1">{sec.label}</p>
              <ul className="text-ink-muted space-y-0.5 text-sm">
                {sec.items.map((it) => (
                  <li key={it}>· {it}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
