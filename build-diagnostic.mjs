import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

const cmd = 'vite build 2>&1';

try {
  const stdout = execSync(cmd, {
    encoding: 'utf8',
    env: { ...process.env, FORCE_COLOR: '0' },
    shell: true,
  });
  console.log(stdout);
} catch (e) {
  const out = e.stdout || '';
  const err = e.stderr || '';
  writeFileSync('build-errors.txt', 'STDOUT:\n' + out + '\nSTDERR:\n' + err, 'utf8');
  console.log(out);
  console.error(err);
  console.log('===BUILD FAILED - details above===');
  process.exit(1);
}
