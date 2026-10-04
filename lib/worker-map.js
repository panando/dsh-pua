import { FLAVORS } from "./flavors.js";

const CORE = "skills/pua/SKILL.md";
const ROUTER = "skills/pua/references/methodology-router.md";
const CORE_HEADINGS = {
  contract: "新模型执行契约：狠话不减，别把施压演成汇报",
  redlines: "三条红线（安全红线，碰了就是 3.25）",
  diagnosis: "诊断先行：防止“分析正确但不行动”",
  behavior: "核心行为协议：🔥『PUA生效』",
  narration: "旁白协议",
  owner: "Owner 意识（谁痛苦谁改变）",
  agency: "能动性等级（被动 3.25 vs 主动 3.75）",
  pressure: "压力升级与失败响应",
  deescalation: "突破降压协议（De-escalation）",
  reframe: "深层换框（Cognitive Reframe）",
  failureMode: "失败模式分析（Pattern-Aware Pressure）",
  methodology: "通用方法论（卡壳时强制执行）",
  gotchas: "Gotchas（已知陷阱 — 从真实使用中提炼）",
  harness: "Harness 防作弊治理（权责分离）",
  lifecycle: "任务生命周期行为框架",
  exit: "体面的退出",
  completion: "任务完成反馈（每次主要任务交付后）",
  misc: "搭配使用",
};

const section = (path, heading) => ({ kind: "section", path, heading });
const file = (path) => ({ kind: "file", path });
const block = (path, heading, startMarker, endMarker) => ({ kind: "block", path, heading, startMarker, endMarker });

export const WORKERS = [
  { id: "kernel.intro", always: true, sources: [{ kind: "intro", path: CORE }] },
  { id: "kernel.contract", always: true, sources: [section(CORE, CORE_HEADINGS.contract)] },
  { id: "kernel.redlines", always: true, sources: [section(CORE, CORE_HEADINGS.redlines)] },
  { id: "kernel.diagnosis", always: true, sources: [section(CORE, CORE_HEADINGS.diagnosis)] },
  { id: "kernel.behavior", always: true, sources: [section(CORE, CORE_HEADINGS.behavior)] },
  { id: "narration.rules", always: true, sources: [block(CORE, CORE_HEADINGS.narration, "## " + CORE_HEADINGS.narration, "**旁白示范**")] },
  { id: "narration.display", always: true, sources: [block(CORE, CORE_HEADINGS.narration, "**状态展示**", "## " + CORE_HEADINGS.owner)] },
  { id: "reference.narration.examples", reference: true, sources: [block(CORE, CORE_HEADINGS.narration, "**旁白示范**", "**状态展示**")] },
  { id: "kernel.owner", always: true, sources: [section(CORE, CORE_HEADINGS.owner)] },
  { id: "kernel.agency", always: true, sources: [section(CORE, CORE_HEADINGS.agency)] },
  { id: "kernel.gotchas", always: true, sources: [section(CORE, CORE_HEADINGS.gotchas)] },
  { id: "kernel.lifecycle", always: true, sources: [section(CORE, CORE_HEADINGS.lifecycle)] },
  { id: "kernel.exit", always: true, sources: [section(CORE, CORE_HEADINGS.exit)] },
  { id: "kernel.completion", always: true, sources: [section(CORE, CORE_HEADINGS.completion)] },
  { id: "kernel.misc", always: true, sources: [section(CORE, CORE_HEADINGS.misc)] },
  { id: "route.methodology.core", auto: true, lean: false, sources: [section(ROUTER, "核心原则"), section(ROUTER, "Phase 1：任务类型 → 起始味道"), section(ROUTER, "Phase 3：用户 Override"), section(ROUTER, "自检：怎么判断该不该切")] },
  { id: "route.methodology.failure", triggers: ["failureCount>=1"], sources: [section(ROUTER, "Phase 2：失败模式 → 味道切换")] },
  { id: "phase.failure", triggers: ["failureCount>=1"], sources: [section(CORE, CORE_HEADINGS.pressure)] },
  { id: "phase.deescalation", triggers: ["failureCount>=2"], sources: [section(CORE, CORE_HEADINGS.deescalation), section(CORE, CORE_HEADINGS.reframe), section(CORE, CORE_HEADINGS.failureMode), file("skills/pua/references/de-escalation-protocol.md")] },
  { id: "phase.methodology", triggers: ["failureCount>=1"], sources: [section(CORE, CORE_HEADINGS.methodology)] },
  { id: "phase.integrity", triggers: ["integrityTrigger"], sources: [section(CORE, CORE_HEADINGS.harness)] },
  { id: "display.protocol", always: true, lean: false, sources: [file("skills/pua/references/display-protocol.md")] },
  { id: "mode.p7", modes: ["p7"], sources: [file("skills/p7/SKILL.md"), file("skills/pua/references/p7-protocol.md")] },
  { id: "mode.p9", modes: ["p9"], sources: [file("skills/p9/SKILL.md"), file("skills/pua/references/p9-protocol.md"), file("skills/pua/references/agent-team.md")] },
  { id: "mode.p10", modes: ["p10"], sources: [file("skills/p10/SKILL.md"), file("skills/pua/references/p10-protocol.md"), file("skills/pua/references/agent-team.md")] },
  { id: "mode.pro", modes: ["pro"], sources: [file("skills/pro/SKILL.md"), file("skills/pua/references/evolution-protocol.md"), file("skills/pua/references/platform.md")] },
  { id: "mode.loop", modes: ["pua-loop"], sources: [file("skills/pua-loop/SKILL.md")] },
  { id: "mode.yes", modes: ["yes"], sources: [file("skills/yes/SKILL.md")] },
  { id: "mode.mama", modes: ["mama"], sources: [file("skills/mama/SKILL.md")] },
  { id: "mode.shot", modes: ["shot"], sources: [file("skills/shot/SKILL.md")] },
  { id: "mode.pua-en", modes: ["pua-en"], sources: [file("skills/pua-en/SKILL.md")] },
  { id: "mode.pua-ja", modes: ["pua-ja"], sources: [file("skills/pua-ja/SKILL.md")] },
];

function pushUnique(target, seen, worker) {
  if (seen.has(worker.id) === false) {
    seen.add(worker.id);
    target.push(worker);
  }
}

function flavorWorker(flavor) {
  const descriptor = FLAVORS.find(item => item.id === flavor);
  if (descriptor === undefined) throw new Error("未知风味：" + flavor);
  const sources = [
    { kind: "section-prefix", path: "skills/pua/references/flavors.md", prefix: descriptor.chapter + ". " },
    file("skills/pua/references/methodology-" + flavor + ".md"),
  ];
  if (flavor === "ding") sources.push(file("skills/pua/references/ding-reminders.md"));
  return { id: "flavor." + flavor, sources };
}

export function resolveActiveWorkers(context = {}) {
  const active = [];
  const seen = new Set();
  for (const worker of WORKERS) {
    if (worker.always === true && (context.fidelity !== "lean" || worker.lean !== false)) pushUnique(active, seen, worker);
  }
  const mode = context.mode ?? "pua";
  for (const worker of WORKERS) {
    if (Array.isArray(worker.modes) && worker.modes.includes(mode)) pushUnique(active, seen, worker);
  }
  const failureCount = Number(context.failureCount ?? 0);
  if (failureCount >= 1) {
    for (const worker of WORKERS) {
      if (worker.triggers?.includes("failureCount>=1")) pushUnique(active, seen, worker);
    }
  }
  if (failureCount >= 2) {
    for (const worker of WORKERS) {
      if (worker.triggers?.includes("failureCount>=2")) pushUnique(active, seen, worker);
    }
  }
  if (context.integrityTrigger === true) {
    for (const worker of WORKERS) {
      if (worker.triggers?.includes("integrityTrigger")) pushUnique(active, seen, worker);
    }
  }
  if (context.flavorLocked === true) {
    pushUnique(active, seen, flavorWorker(context.flavor ?? "alibaba"));
  } else {
    for (const worker of WORKERS) {
      if (worker.auto === true && (context.fidelity !== "lean" || worker.lean !== false)) pushUnique(active, seen, worker);
    }
  }
  return active;
}
//# sourceMappingURL=worker-map.js.map
