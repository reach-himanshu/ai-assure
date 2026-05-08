import dayjs from 'dayjs';
import type { EmploymentType, User, Vendor } from '@/lib/types';

const COLORS = ['#2F6B1E', '#5A8F29', '#0F5132', '#3D7DB3', '#7B5EA7', '#B26B00', '#A4262C', '#1F7A8C'];
function color(i: number) {
  return COLORS[i % COLORS.length]!;
}
function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export const LEADERS: User[] = [
  {
    id: 'leader-1',
    name: 'Priya Raman',
    email: 'priya.raman@hr4u.example',
    role: 'leader',
    title: 'Director, HR4U Service Excellence',
    avatarColor: color(0),
    initials: initials('Priya Raman'),
  },
  {
    id: 'leader-2',
    name: 'Marcus Bell',
    email: 'marcus.bell@hr4u.example',
    role: 'leader',
    title: 'VP, HR Shared Services',
    avatarColor: color(2),
    initials: initials('Marcus Bell'),
  },
];

export const QA_ADMINS: User[] = [
  {
    id: 'admin-1',
    name: 'Lena Park',
    email: 'lena.park@hr4u.example',
    role: 'qa_admin',
    title: 'Quality Administrator',
    avatarColor: color(3),
    initials: initials('Lena Park'),
  },
  {
    id: 'admin-2',
    name: 'Diego Alvarez',
    email: 'diego.alvarez@hr4u.example',
    role: 'qa_admin',
    title: 'Quality Administrator',
    avatarColor: color(5),
    initials: initials('Diego Alvarez'),
  },
  {
    id: 'admin-3',
    name: 'Hannah Kim',
    email: 'hannah.kim@hr4u.example',
    role: 'qa_admin',
    title: 'Quality Administrator',
    avatarColor: color(7),
    initials: initials('Hannah Kim'),
  },
];

export const SUPERVISORS: User[] = [
  {
    id: 'sup-1',
    name: 'Aisha Khan',
    email: 'aisha.khan@hr4u.example',
    role: 'supervisor',
    title: 'Senior Supervisor — Benefits Team',
    team: 'Benefits',
    avatarColor: color(0),
    initials: initials('Aisha Khan'),
  },
  {
    id: 'sup-2',
    name: 'Brett Walker',
    email: 'brett.walker@hr4u.example',
    role: 'supervisor',
    title: 'Supervisor — Leave & Time Off',
    team: 'Leave & Time Off',
    avatarColor: color(1),
    initials: initials('Brett Walker'),
  },
  {
    id: 'sup-3',
    name: 'Tomoko Sato',
    email: 'tomoko.sato@hr4u.example',
    role: 'supervisor',
    title: 'Supervisor — Payroll & Compensation',
    team: 'Payroll & Comp',
    avatarColor: color(2),
    initials: initials('Tomoko Sato'),
  },
  {
    id: 'sup-4',
    name: 'Owen Pierce',
    email: 'owen.pierce@hr4u.example',
    role: 'supervisor',
    title: 'Supervisor — Onboarding & Lifecycle',
    team: 'Lifecycle',
    avatarColor: color(4),
    initials: initials('Owen Pierce'),
  },
];

// Per-agent seed:
//  - employmentType: associate (~70%) vs contractor (~30%)
//  - vendor: contractor only
//  - daysSinceTraining: how long ago training was completed (drives nesting status).
//    > 90 = seasoned. 0–90 = currently in nesting (90-day rolling window). One agent
//    is just past nesting (~95 days) and two are deep in nesting (~30 and ~60 days)
//    so the demo shows seasoned + transitional + nesting reviewers side-by-side.
interface AgentSeed {
  name: string;
  supervisorId: string;
  employmentType: EmploymentType;
  vendor?: Vendor;
  daysSinceTraining: number;
}

const AGENT_SEED: AgentSeed[] = [
  { name: 'Maya Chen', supervisorId: 'sup-1', employmentType: 'associate', daysSinceTraining: 720 },
  { name: 'Devon Rivera', supervisorId: 'sup-1', employmentType: 'associate', daysSinceTraining: 540 },
  { name: 'Jacob Patel', supervisorId: 'sup-1', employmentType: 'contractor', vendor: 'IBM', daysSinceTraining: 410 },
  { name: 'Sasha Williams', supervisorId: 'sup-1', employmentType: 'associate', daysSinceTraining: 280 },
  { name: 'Ethan Brooks', supervisorId: 'sup-1', employmentType: 'associate', daysSinceTraining: 200 },
  { name: 'Naomi Singh', supervisorId: 'sup-2', employmentType: 'contractor', vendor: 'TCS', daysSinceTraining: 365 },
  { name: 'Kayla Foster', supervisorId: 'sup-2', employmentType: 'associate', daysSinceTraining: 510 },
  { name: 'Aaron Thompson', supervisorId: 'sup-2', employmentType: 'associate', daysSinceTraining: 220 },
  { name: 'Elena Volkov', supervisorId: 'sup-2', employmentType: 'contractor', vendor: 'EY', daysSinceTraining: 305 },
  { name: 'Caleb Ramirez', supervisorId: 'sup-2', employmentType: 'associate', daysSinceTraining: 95 }, // just past nesting
  { name: 'Mira Joshi', supervisorId: 'sup-3', employmentType: 'associate', daysSinceTraining: 470 },
  { name: 'Tyler Nguyen', supervisorId: 'sup-3', employmentType: 'contractor', vendor: 'Accenture', daysSinceTraining: 180 },
  { name: 'Bianca Romero', supervisorId: 'sup-3', employmentType: 'associate', daysSinceTraining: 600 },
  { name: 'Greg Mortenson', supervisorId: 'sup-3', employmentType: 'associate', daysSinceTraining: 350 },
  { name: 'Lara Becker', supervisorId: 'sup-3', employmentType: 'contractor', vendor: 'Cognizant', daysSinceTraining: 250 },
  { name: 'Adam Holloway', supervisorId: 'sup-4', employmentType: 'associate', daysSinceTraining: 800 },
  { name: 'Yara Khalil', supervisorId: 'sup-4', employmentType: 'associate', daysSinceTraining: 430 },
  { name: 'Jin Park', supervisorId: 'sup-4', employmentType: 'contractor', vendor: 'IBM', daysSinceTraining: 165 },
  { name: 'Sophia Bennett', supervisorId: 'sup-4', employmentType: 'associate', daysSinceTraining: 60 },  // nesting
  { name: 'Wesley Cole', supervisorId: 'sup-4', employmentType: 'contractor', vendor: 'TCS', daysSinceTraining: 30 }, // nesting
];

export const AGENTS: User[] = AGENT_SEED.map((a, i) => {
  const sup = SUPERVISORS.find((s) => s.id === a.supervisorId)!;
  return {
    id: `agent-${i + 1}`,
    name: a.name,
    email: `${a.name.toLowerCase().replace(' ', '.')}@hr4u.example`,
    role: 'agent',
    team: sup.team,
    supervisorId: a.supervisorId,
    title: a.employmentType === 'contractor' ? `HR4U Agent (${a.vendor})` : 'HR4U Agent',
    avatarColor: color(i + 1),
    initials: initials(a.name),
    employmentType: a.employmentType,
    vendor: a.vendor,
    trainingCompleteDate: dayjs().subtract(a.daysSinceTraining, 'day').toISOString(),
  };
});

export const ALL_USERS: User[] = [...LEADERS, ...QA_ADMINS, ...SUPERVISORS, ...AGENTS];
