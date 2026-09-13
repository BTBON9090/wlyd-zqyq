/**
 * 下载 public 目录缺失的演示图片（panorama / products / services）。
 * 运行：node scripts/fetch-public-images.mjs
 */
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

const products = [
  "p1-servo.jpg",
  "p2-oil.jpg",
  "p3-gloves.jpg",
  "p4-paper.jpg",
  "p5-camera.jpg",
  "p6-access.jpg",
  "p7-wipes.jpg",
  "p8-cleaner.jpg",
  "p9-wrench.jpg",
  "p10-cone.jpg",
  "p11-sandbag.jpg",
  "p12-pump.jpg",
  "p13-extinguisher.jpg",
  "p14-hose.jpg",
  "p15-pen.jpg",
  "p16-folder.jpg",
];

const panoramas = [
  { file: "park-360.jpg", w: 2400, h: 900 },
  { file: "gate.jpg", w: 800, h: 500 },
  { file: "equip.jpg", w: 800, h: 500 },
  { file: "plaza.jpg", w: 800, h: 500 },
  { file: "lab.jpg", w: 800, h: 500 },
  { file: "dock.jpg", w: 800, h: 500 },
];

/** 企业服务封面 / 详情 / 案例用图（真实摄影图，picsum 稳定 seed） */
const serviceIds = Array.from({ length: 14 }, (_, i) => `s${i + 1}`);

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function download(url, dest, { force = false } = {}) {
  if (!force && (await exists(dest))) {
    console.log("SKIP", path.relative(root, dest));
    return;
  }
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  console.log("OK", path.relative(root, dest));
}

async function main() {
  const force = process.argv.includes("--force");
  await mkdir(path.join(root, "products"), { recursive: true });
  await mkdir(path.join(root, "panorama"), { recursive: true });
  await mkdir(path.join(root, "services"), { recursive: true });

  for (const file of products) {
    const seed = file.replace(/\.jpg$/, "");
    const dest = path.join(root, "products", file);
    await download(`https://picsum.photos/seed/${seed}/640/480.jpg`, dest, { force });
  }

  for (const { file, w, h } of panoramas) {
    const seed = file.replace(/\.jpg$/, "");
    const dest = path.join(root, "panorama", file);
    await download(`https://picsum.photos/seed/park-${seed}/${w}/${h}.jpg`, dest, { force });
  }

  for (const id of serviceIds) {
    const cover = path.join(root, "services", `${id}.jpg`);
    const d1 = path.join(root, "services", `${id}-d1.jpg`);
    const d2 = path.join(root, "services", `${id}-d2.jpg`);
    await download(`https://picsum.photos/seed/park-svc-${id}/960/720.jpg`, cover, { force });
    await download(`https://picsum.photos/seed/park-svc-${id}-d1/960/720.jpg`, d1, { force });
    await download(`https://picsum.photos/seed/park-svc-${id}-d2/960/720.jpg`, d2, { force });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
