import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { Modal } from '@/components/Modal';
import { useApp } from '@/stores';
import { useToast } from '@/components/Toast';
import { CHANNEL_LABEL, type Channel } from '@/lib/types';
import { CATEGORIES_BY_CHANNEL } from '@/data/scenarios';

interface Props {
  open: boolean;
  onClose: () => void;
}

const HRC_PATTERN = /^HRC\d{7}$/;
const IMS_PATTERN = /^IMS\d{7}$/;

export function NewEvaluationModal({ open, onClose }: Props) {
  const users = useApp((s) => s.users);
  const createManualEvaluation = useApp((s) => s.createManualEvaluation);
  const toast = useToast();
  const navigate = useNavigate();

  const agents = useMemo(() => users.filter((u) => u.role === 'agent'), [users]);

  const [channel, setChannel] = useState<Channel>('call');
  const [agentId, setAgentId] = useState<string>(agents[0]?.id ?? '');
  const [hrcCaseNumber, setHrc] = useState('HRC');
  const [imsCaseNumber, setIms] = useState('IMS');
  const [callUrl, setCallUrl] = useState('');
  const [caseDateTime, setCaseDateTime] = useState(dayjs().format('YYYY-MM-DDTHH:mm'));
  const [summary, setSummary] = useState('');
  const [snowCategory, setSnowCategory] = useState<string>(CATEGORIES_BY_CHANNEL.call?.[0] ?? '');

  const channelOptions: Channel[] = ['call', 'email', 'portal', 'chat'];

  const hrcValid = HRC_PATTERN.test(hrcCaseNumber);
  const imsValid = channel !== 'chat' || IMS_PATTERN.test(imsCaseNumber);
  const summaryValid = summary.trim().length >= 20;
  const formValid = !!agentId && hrcValid && imsValid && summaryValid && !!caseDateTime;

  const onChannelChange = (c: Channel) => {
    setChannel(c);
    const cats = CATEGORIES_BY_CHANNEL[c];
    if (cats?.length) setSnowCategory(cats[0]!);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) return;
    const id = createManualEvaluation({
      channel,
      agentId,
      hrcCaseNumber,
      imsCaseNumber: channel === 'chat' ? imsCaseNumber : undefined,
      callUrl: channel === 'call' ? callUrl || undefined : undefined,
      caseDateTime: dayjs(caseDateTime).toISOString(),
      summary: summary.trim(),
      snowCategory,
    });
    toast('New evaluation created. Score the rubric to publish.', 'success');
    onClose();
    navigate(`/app/evaluations/${id}`);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New evaluation"
      description="Key the interaction details. After saving, you'll land on the evaluation page to score each criterion — no AI scoring is involved."
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Channel */}
        <div>
          <label className="label">Channel</label>
          <div className="mt-1 grid grid-cols-4 gap-2">
            {channelOptions.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onChannelChange(c)}
                className={
                  'rounded-xl border px-3 py-2 text-sm font-medium transition ' +
                  (channel === c
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-800 dark:text-brand-200'
                    : 'border-line dark:border-line-dark hover:border-brand-300')
                }
              >
                {CHANNEL_LABEL[c]}
              </button>
            ))}
          </div>
          <p className="text-xs text-ink-muted mt-1">CSAT cannot be created manually — it comes from the survey channel only.</p>
        </div>

        {/* Agent */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Agent <span className="text-band-fail">*</span></label>
            <select className="input mt-1" value={agentId} onChange={(e) => setAgentId(e.target.value)} required>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                  {a.employmentType === 'contractor' && a.vendor ? ` · ${a.vendor}` : ''}
                  {' · '}
                  {a.team}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Case date & time <span className="text-band-fail">*</span></label>
            <input
              type="datetime-local"
              className="input mt-1"
              required
              value={caseDateTime}
              onChange={(e) => setCaseDateTime(e.target.value)}
            />
          </div>
        </div>

        {/* HRC + IMS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">HRC case number <span className="text-band-fail">*</span></label>
            <input
              className="input mt-1 font-mono"
              required
              value={hrcCaseNumber}
              onChange={(e) => setHrc(e.target.value.toUpperCase())}
              placeholder="HRC0123456"
              aria-invalid={!hrcValid}
            />
            {!hrcValid && (
              <p className="text-xs text-band-fail mt-1">Format: HRC followed by 7 digits.</p>
            )}
          </div>
          {channel === 'chat' && (
            <div>
              <label className="label">IMS interaction number <span className="text-band-fail">*</span></label>
              <input
                className="input mt-1 font-mono"
                required
                value={imsCaseNumber}
                onChange={(e) => setIms(e.target.value.toUpperCase())}
                placeholder="IMS0123456"
                aria-invalid={!imsValid}
              />
              {!imsValid && (
                <p className="text-xs text-band-fail mt-1">Format: IMS followed by 7 digits.</p>
              )}
            </div>
          )}
        </div>

        {/* Category + (Call URL when call) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">ServiceNow category</label>
            <select className="input mt-1" value={snowCategory} onChange={(e) => setSnowCategory(e.target.value)}>
              {(CATEGORIES_BY_CHANNEL[channel] ?? ['General']).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          {channel === 'call' && (
            <div>
              <label className="label">Call URL <span className="text-ink-muted font-normal">(optional)</span></label>
              <input
                className="input mt-1"
                value={callUrl}
                onChange={(e) => setCallUrl(e.target.value)}
                placeholder="https://genesys.hr4u.example/recordings/…"
              />
            </div>
          )}
        </div>

        {/* Summary */}
        <div>
          <label className="label">Summary <span className="text-band-fail">*</span></label>
          <textarea
            className="input mt-1 min-h-[100px]"
            required
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Brief context of the interaction — what the customer needed and what the agent did."
            aria-invalid={!summaryValid}
          />
          <p className="text-xs text-ink-muted mt-1">{summary.length} / 20 minimum</p>
        </div>

        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 px-4 py-3 text-sm">
          After saving you'll land on the evaluation detail page with a blank rubric. Score each criterion via the existing controls and add reviewer comments — same flow as a re-evaluation.
        </div>

        <footer className="flex items-center justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={!formValid}>
            Create & score
          </button>
        </footer>
      </form>
    </Modal>
  );
}
