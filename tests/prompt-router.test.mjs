import test from "node:test";
import assert from "node:assert/strict";
import { SourceCatalog } from "../lib/source.js";
import { resolveActiveWorkers, WORKERS } from "../lib/worker-map.js";
import { renderActivePrompt } from "../lib/content.js";

const CORE = "skills/pua/SKILL.md";
const catalog = new SourceCatalog();

test("SourceCatalog 按标题读取精确 section，并拒绝未知标题", () => {
  const redlines = catalog.readSection(CORE, "三条红线（安全红线，碰了就是 3.25）");
  assert.match(redlines, /^## 三条红线（安全红线，碰了就是 3\.25）/u);
  assert.match(redlines, /闭环意识/u);
  assert.throws(() => catalog.readSection(CORE, "不存在的章节"), /未找到|不存在/u);
});

test("worker map 覆盖核心 SKILL.md 的每个二级标题，不丢规则入口", () => {
  const headings = catalog.listHeadings(CORE);
  const covered = new Set(WORKERS.flatMap(worker => worker.sources).filter(source => source.path === CORE && typeof source.heading === "string").map(source => source.heading));
  for (const heading of headings) assert.ok(covered.has(heading), "未覆盖的核心标题：" + heading);
});

test("默认 pua/auto 只加载常驻与自动路由材料，不加载失败专项和演示大块", () => {
  const context = { mode: "pua", flavor: "auto", flavorLocked: false, failureCount: 0, loopActive: false, integrityTrigger: false };
  const ids = resolveActiveWorkers(context).map(worker => worker.id);
  assert.ok(ids.includes("kernel.redlines"));
  assert.ok(ids.includes("kernel.contract"));
  assert.ok(ids.includes("route.methodology.core"));
  assert.equal(ids.includes("phase.failure"), false);
  assert.equal(ids.includes("reference.narration.examples"), false);
  assert.ok(ids.includes("display.protocol"));
  const prompt = renderActivePrompt(catalog, context);
  assert.match(prompt, /## 三条红线/u);
  assert.match(prompt, /核心行为协议/u);
  assert.match(prompt, /方法论智能路由/u);
  assert.doesNotMatch(prompt, /\*\*旁白示范\*\*/u);
  assert.ok(Buffer.byteLength(prompt, "utf8") < 40 * 1024, "默认 prompt 应明显小于当前 53KB");
});

test("failureCount >= 1 自动追加失败专项，且保持在预算内", () => {
  const base = renderActivePrompt(catalog, { mode: "pua", flavor: "auto", flavorLocked: false, failureCount: 0, loopActive: false, integrityTrigger: false });
  const failed = renderActivePrompt(catalog, { mode: "pua", flavor: "auto", flavorLocked: false, failureCount: 1, loopActive: false, integrityTrigger: false });
  assert.match(failed, /压力升级与失败响应/u);
  assert.ok(Buffer.byteLength(failed, "utf8") > Buffer.byteLength(base, "utf8"));
  assert.ok(Buffer.byteLength(failed, "utf8") < 48 * 1024);
});

test("p9 加载角色材料但不会串入 pua-ja", () => {
  const prompt = renderActivePrompt(catalog, { mode: "p9", flavor: "auto", flavorLocked: false, failureCount: 0, loopActive: false, integrityTrigger: false });
  assert.match(prompt, /P9/u);
  assert.match(prompt, /agent-team/u);
  assert.equal(prompt.includes("三つの鉄則"), false);
});

test("锁定风味只加载对应风味与方法论", () => {
  const prompt = renderActivePrompt(catalog, { mode: "pua", flavor: "huawei", flavorLocked: true, failureCount: 0, loopActive: false, integrityTrigger: false });
  assert.match(prompt, /华为/u);
  assert.match(prompt, /methodology-huawei|RCA|蓝军/u);
  assert.equal(prompt.includes("Tesla/SpaceX 味道方法论"), false);
});
