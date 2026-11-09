import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const baseline = JSON.parse(readFileSync(join(root, 'docs/ui-baseline.json'), 'utf8'));
const hash = path => existsSync(path) ? createHash('sha256').update(readFileSync(path)).digest('hex') : null;
const failures = [];
for (const [file, expected] of Object.entries(baseline.files)) {
  if (hash(join(root, file)) !== (baseline.prototypeOverrides[file] || expected)) failures.push(`本地未登记变更：${file}`);
}
for (const [file, expected] of Object.entries(baseline.prototypeOnly)) {
  if (hash(join(root, file)) !== expected) failures.push(`原型适配未登记变更：${file}`);
}
const sourceArg = process.argv.indexOf('--source');
if (sourceArg >= 0) {
  if (!process.argv[sourceArg + 1]) throw new Error('--source 必须指定联调工程根目录');
  const source = resolve(process.argv[sourceArg + 1], baseline.sourceProject);
  for (const [file, expected] of Object.entries(baseline.files)) {
    if (hash(join(source, file)) !== expected) failures.push(`联调源码已变化，需要同步：${file}`);
  }
  function scan(dir) {
    for (const entry of readdirSync(join(source, dir), { withFileTypes: true })) {
      if(entry.name.startsWith('.'))continue;
      const file=dir+'/'+entry.name;
      if(entry.isDirectory())scan(file);
      else if(!baseline.files[file])failures.push(`联调新增文件，需要同步：${file}`);
    }
  }
  scan('src');
}
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(`UI 基线 ${baseline.sourceCommit.slice(0, 7)} 校验通过；本地演示适配已单独登记。`);
