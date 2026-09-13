import { readdir, readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const files = await readdir(new URL('../dist/assets/', import.meta.url));
const forbidden = ['mockGateway', 'AcceptancePanel', 'demo-enterprise-user', 'PARK2026', '验证码 123456', '验收工具', '首页版本对比'];
for (const file of files.filter(name => name.endsWith('.js'))) {
  const source = await readFile(new URL(`../dist/assets/${file}`, import.meta.url), 'utf8');
  for (const marker of forbidden) assert(!file.includes(marker) && !source.includes(marker), `正式构建包含演示标记：${marker} (${file})`);
}
console.log('正式构建隔离检查通过：不包含模拟接口、测试账号或验收面板。');
