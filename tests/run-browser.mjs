import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const url = process.env.RIDE_URL || 'http://127.0.0.1:4173/';
let server;
async function ready() {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
    return response.ok && (await response.text()).includes('INFINITE RIDE');
  } catch {
    return false;
  }
}
try {
  if (!(await ready())) {
    if (process.env.RIDE_URL) throw Error(`No INFINITE RIDE server at ${url}`);
    server = spawn(
      process.execPath,
      [
        'node_modules/vite/bin/vite.js',
        'preview',
        '--host',
        '127.0.0.1',
        '--port',
        '4173',
        '--strictPort',
      ],
      { cwd: root, windowsHide: true, stdio: 'ignore' },
    );
    for (let i = 0; i < 50 && !(await ready()); i++)
      await new Promise((resolve) => setTimeout(resolve, 200));
    if (!(await ready())) throw Error('Production preview could not start on 4173');
  }
  const files = process.argv.includes('--soak')
    ? ['soak-browser.mjs']
    : [
        'browser.mjs',
        'world-browser.mjs',
        'traffic-browser.mjs',
        'modes-browser.mjs',
        'polish-browser.mjs',
        'interface-browser.mjs',
        'audit-browser.mjs',
        'security-browser.mjs',
        'pages.mjs',
      ];
  for (const file of files) {
    console.log(`\nRunning ${file}`);
    const child = spawn(process.execPath, [`tests/${file}`], {
      cwd: root,
      windowsHide: true,
      stdio: 'inherit',
      env: { ...process.env, RIDE_URL: url },
    });
    const code = await new Promise((resolve, reject) => {
      child.on('error', reject);
      child.on('exit', resolve);
    });
    if (code !== 0) throw Error(`${file} failed (${code})`);
  }
} finally {
  server?.kill();
}
