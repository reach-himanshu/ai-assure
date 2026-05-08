#!/usr/bin/env node
// Headless smoke check: spawn `npm run dev`, hit every route, ensure 200s and module compile.
import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';

const PORT = 5173;
const BASE = `http://localhost:${PORT}`;

const ROUTES = [
  '/',
  '/login',
  '/app/dashboard',
  '/app/evaluations',
  '/app/queue',
  '/app/appeals',
  '/app/admin',
  '/app/insights',
];

const SOURCE_MODULES = [
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/stores/index.ts',
  '/src/data/seed.ts',
  '/src/features/login/PersonaPicker.tsx',
  '/src/features/dashboard/Dashboard.tsx',
  '/src/features/evaluations/EvaluationDetail.tsx',
  '/src/features/admin/AdminConsole.tsx',
];

async function ping(path) {
  try {
    const res = await fetch(BASE + path);
    return { path, status: res.status };
  } catch (err) {
    return { path, status: 'ERR', error: err.message };
  }
}

async function waitForServer(timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(BASE);
      if (res.ok) return true;
    } catch {}
    await wait(300);
  }
  return false;
}

const child = spawn('npm', ['run', 'dev'], {
  shell: true,
  stdio: ['ignore', 'pipe', 'pipe'],
});

let output = '';
child.stdout.on('data', (d) => (output += d.toString()));
child.stderr.on('data', (d) => (output += d.toString()));

let pass = true;
try {
  console.log('▸ waiting for dev server...');
  const ok = await waitForServer();
  if (!ok) {
    console.error('✗ dev server did not start within 30s');
    console.error(output.slice(-1500));
    process.exit(1);
  }

  console.log('▸ checking routes:');
  for (const r of ROUTES) {
    const { status } = await ping(r);
    const ok = status === 200;
    if (!ok) pass = false;
    console.log(`  ${ok ? '✓' : '✗'} ${status}  ${r}`);
  }

  console.log('▸ checking source module compilation:');
  for (const m of SOURCE_MODULES) {
    const { status } = await ping(m);
    const ok = status === 200;
    if (!ok) pass = false;
    console.log(`  ${ok ? '✓' : '✗'} ${status}  ${m}`);
  }

  console.log(pass ? '\n✓ smoke passed' : '\n✗ smoke failed');
} finally {
  child.kill();
  await wait(300);
}
process.exit(pass ? 0 : 1);
