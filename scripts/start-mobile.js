const { spawn } = require('node:child_process');
const os = require('node:os');

function getLanIp() {
  const networks = os.networkInterfaces();
  for (const entries of Object.values(networks)) {
    for (const entry of entries ?? []) {
      if (entry.family === 'IPv4' && !entry.internal) {
        return entry.address;
      }
    }
  }

  return 'localhost';
}

const mode = process.argv[2] || 'lan';
const extraArgs = process.argv.slice(3);
const syncEndpoint = `http://${getLanIp()}:4100`;

console.log(`Using default mobile sync endpoint: ${syncEndpoint}`);

const child = spawn(
  'npx',
  ['expo', 'start', '--host', mode, ...extraArgs],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      EXPO_PUBLIC_SYNC_ENDPOINT: syncEndpoint,
    },
  }
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
