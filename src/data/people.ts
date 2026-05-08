import type { User } from '@/lib/types';

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

const AGENT_SEED: { name: string; supervisorId: string }[] = [
  { name: 'Maya Chen', supervisorId: 'sup-1' },
  { name: 'Devon Rivera', supervisorId: 'sup-1' },
  { name: 'Jacob Patel', supervisorId: 'sup-1' },
  { name: 'Sasha Williams', supervisorId: 'sup-1' },
  { name: 'Ethan Brooks', supervisorId: 'sup-1' },
  { name: 'Naomi Singh', supervisorId: 'sup-2' },
  { name: 'Kayla Foster', supervisorId: 'sup-2' },
  { name: 'Aaron Thompson', supervisorId: 'sup-2' },
  { name: 'Elena Volkov', supervisorId: 'sup-2' },
  { name: 'Caleb Ramirez', supervisorId: 'sup-2' },
  { name: 'Mira Joshi', supervisorId: 'sup-3' },
  { name: 'Tyler Nguyen', supervisorId: 'sup-3' },
  { name: 'Bianca Romero', supervisorId: 'sup-3' },
  { name: 'Greg Mortenson', supervisorId: 'sup-3' },
  { name: 'Lara Becker', supervisorId: 'sup-3' },
  { name: 'Adam Holloway', supervisorId: 'sup-4' },
  { name: 'Yara Khalil', supervisorId: 'sup-4' },
  { name: 'Jin Park', supervisorId: 'sup-4' },
  { name: 'Sophia Bennett', supervisorId: 'sup-4' },
  { name: 'Wesley Cole', supervisorId: 'sup-4' },
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
    title: 'HR4U Agent',
    avatarColor: color(i + 1),
    initials: initials(a.name),
  };
});

export const ALL_USERS: User[] = [...LEADERS, ...QA_ADMINS, ...SUPERVISORS, ...AGENTS];
