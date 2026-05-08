# AI-Assure — A Quality Intelligence Platform (UX prototype)

A clickable React + Vite + Tailwind prototype for the *AI-Assure* quality
intelligence platform described in the PRD. Stakeholders can experience the
flow across four personas before engineering kickoff. **No real AI pipeline** —
every score, confidence, evidence quote, and theme tag is synthetic.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to dist/
npm run test     # vitest smoke tests
```

> Tested on Node 20.12. The toolchain (Vite 5, Vitest 1) is pinned for compatibility with Node 20 LTS. If you upgrade to Node 22+, you can move to Vite 8 / Vitest 4.

## What's in here

- **Personas (with persona-card login + in-header switcher):**
  Agent · Supervisor · QA Admin · Leader. Switch persona at any time from the header dropdown.
- **Channels:** Call · Email · Portal · Chat · CSAT, each with realistic synthetic content.
- **Evaluation detail page** with the HR4U rubric, evidence quotes mapped to rubric criteria,
  click-to-scroll transcript / email viewer, and Genesys + ServiceNow sidebar cards.
- **Appeal workflow** — agents file within a configurable 7-day window; routes to their
  supervisor; supervisor can uphold, overturn, or partially adjust with a score delta;
  audit trail entry for every step.
- **HITL queues** — low-confidence, random sample, PII/exception, appeals — with bulk approve.
- **QA Admin configuration** — auto-approve threshold, low-confidence cutoff, sampling rate,
  pass/needs-review bands, appeal window, plus a rubric editor with weight validation.
- **Dashboards per persona** with Recharts: trend lines, channel breakdown, calibration,
  themes, NPS-style score, audit log, etc.
- **Light + dark mode toggle.** Desktop-first (1280–1920).
- **Persistence** via localStorage; "Reset demo" wipes everything back to the seed.

## Demo script

1. **Agent** (e.g. Maya Chen) → Dashboard → recent evaluation that's *needs review* → File appeal.
2. **Supervisor** of that agent (e.g. Aisha Khan) → Review queue / Appeals → Decide (partially adjust).
3. **QA Admin** (e.g. Lena Park) → Configuration → bump auto-approve threshold to 85%; rename a criterion.
4. **Leader** (e.g. Priya Raman) → Dashboard / Insights → CSAT, themes, calibration.

## Project layout

```
src/
  components/             # Logo, Avatar, ScoreBadge, KpiTile, Modal, Toast, ChannelIcon, EmptyState
  features/
    login/PersonaPicker.tsx
    shell/AppShell.tsx
    dashboard/{Dashboard,AgentDash,SupervisorDash,QAAdminDash,LeaderDash}.tsx
    evaluations/{EvaluationList,EvaluationDetail,RubricPanel,EvidencePanel,TranscriptViewer,IntegrationSidebar}.tsx
    appeals/{AppealModal,AppealDecisionModal,Appeals}.tsx
    queue/QueueView.tsx
    admin/AdminConsole.tsx
    insights/Insights.tsx
    agents/AgentProfile.tsx
  data/                   # synthetic users, scenarios, transcripts, seed
  lib/                    # types, scoring, dates, rng, format, rubric
  stores/                 # zustand store with localStorage persistence
  tests/                  # vitest scoring + appeal-window + appeal-workflow tests
```

## Branding

Inspired by humana.com — clean white surfaces, dark forest-green primary, generous
whitespace, humanist sans (Source Sans 3), large clear cards. Humana's name, logo,
and copy are not used.
