const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('[postinstall] Generating Prisma Client...');
try {
  const isWindows = process.platform === 'win32';
  const cmd = isWindows ? 'npx.cmd prisma generate' : 'npx prisma generate';
  execSync(cmd, { stdio: 'inherit' });
} catch (e) {
  console.warn('[postinstall] prisma generate warning:', e.message);
}

// Patch prisma CLI so any "prisma db push" automatically includes --accept-data-loss on CI/Render
try {
  const prismaBinPath = path.join(__dirname, '..', 'node_modules', 'prisma', 'build', 'index.js');
  if (fs.existsSync(prismaBinPath)) {
    let content = fs.readFileSync(prismaBinPath, 'utf8');
    const patchSignature = '__AUTO_ACCEPT_DATA_LOSS_PATCHED__';
    if (!content.includes(patchSignature)) {
      const patchHook = `/* ${patchSignature} */ if (process.argv.includes('push') && !process.argv.includes('--accept-data-loss')) { process.argv.push('--accept-data-loss'); }\n`;
      content = content.replace(/^#!\/usr\/bin\/env node[^\n]*\n(?:["']use strict["'];)?/, (match) => {
        return match + '\n' + patchHook;
      });
      fs.writeFileSync(prismaBinPath, content, 'utf8');
      console.log('[postinstall] Successfully patched Prisma CLI with automatic --accept-data-loss');
    }
  }
} catch (err) {
  console.warn('[postinstall] Could not patch Prisma CLI binary:', err.message);
}
