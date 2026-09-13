import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

process.env.DEPLOY_BASE = "/client/";
const result = spawnSync("npm", ["run", "build"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});
if (result.status) process.exit(result.status);

const html = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "..", "dist", "index.html"),
  "utf8",
);
if (!html.includes("/client/assets/")) {
  console.error(
    "\n[build:cloud] 校验失败：dist/index.html 未包含 /client/assets/。\n" +
      "请勿用 npm run build 上传腾讯云；必须用 npm run build:cloud。\n",
  );
  process.exit(1);
}

console.log(
  "\n[build:cloud] 校验通过。请把 dist/ 内全部文件覆盖上传到云托管 /client/ 目录。\n" +
    "访问地址：https://<域名>/client/  或  https://<域名>/client/#/\n",
);
