import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const NL = String.fromCharCode(10);

function stripFrontmatter(text) {
    if (text.startsWith("---") === false) return text.trim();
    const end = text.indexOf(NL + "---", 3);
    if (end < 0) return text.trim();
    const after = text.indexOf(NL, end + 1);
    return (after < 0 ? "" : text.slice(after + 1)).trim();
}
export class SourceCatalog {
    revision;
    documents = new Map();
    constructor() {
        const root = new URL("../assets/pua/", import.meta.url);
        const manifest = JSON.parse(readFileSync(new URL("upstream.json", root), "utf8"));
        this.revision = manifest.revision;
        for (const entry of manifest.files.filter(entry => entry.file.startsWith("upstream/"))) {
            const top = entry.source.split("/")[0];
            const allowed = top === "skills" || top === "commands" || top === "agents" || top === "hooks";
            if (allowed === false || entry.source.includes("..") || entry.file !== "upstream/" + entry.source)
                throw new Error("原版文件清单包含无效路径。");
            const bytes = readFileSync(new URL(entry.file, root));
            if (createHash("sha256").update(bytes).digest("hex") !== entry.sha256)
                throw new Error("原版文件指纹不匹配：" + entry.source);
            this.documents.set(entry.source, bytes.toString("utf8"));
        }
        if (this.documents.has("skills/pua/SKILL.md") === false)
            throw new Error("缺少原版 PUA 核心文件。");
    }
    list() { return [...this.documents.keys()].filter(path => path.endsWith(".md")).sort(); }
    read(path) {
        const text = this.documents.get(path);
        if (text === undefined)
            throw new Error("未收录此原版资料：" + path);
        return text;
    }
    body(path) { return stripFrontmatter(this.read(path)); }
    listHeadings(path) {
        return this.body(path).split(NL).filter(line => line.startsWith("## ")).map(line => line.slice(3).trim());
    }
    readIntro(path) {
        const lines = this.body(path).split(NL);
        const first = lines.findIndex(line => line.startsWith("## "));
        return (first < 0 ? lines : lines.slice(0, first)).join(NL).trim();
    }
    readSection(path, heading) {
        const lines = this.body(path).split(NL);
        const start = lines.findIndex(line => line.startsWith("## ") && line.slice(3).trim() === heading);
        if (start < 0) throw new Error("未找到章节：" + path + "#" + heading);
        let end = lines.length;
        for (let index = start + 1; index < lines.length; index += 1) {
            if (lines[index].startsWith("## ")) { end = index; break; }
        }
        return lines.slice(start, end).join(NL).trim();
    }
    readSectionByPrefix(path, prefix) {
        const lines = this.body(path).split(NL);
        const start = lines.findIndex(line => line.startsWith("## ") && line.slice(3).trim().startsWith(prefix));
        if (start < 0) throw new Error("未找到章节：" + path + "#" + prefix);
        let end = lines.length;
        for (let index = start + 1; index < lines.length; index += 1) {
            if (lines[index].startsWith("## ")) { end = index; break; }
        }
        return lines.slice(start, end).join(NL).trim();
    }
    readBlock(path, startMarker, endMarker = "") {
        const text = this.body(path);
        const start = text.indexOf(startMarker);
        if (start < 0) throw new Error("未找到片段起点：" + path + "#" + startMarker);
        const end = endMarker ? text.indexOf(endMarker, start + startMarker.length) : -1;
        if (endMarker && end < 0) throw new Error("未找到片段终点：" + path + "#" + endMarker);
        return text.slice(start, end < 0 ? text.length : end).trim();
    }
    readSource(source) {
        switch (source.kind) {
            case "file": return this.body(source.path);
            case "intro": return this.readIntro(source.path);
            case "section": return this.readSection(source.path, source.heading);
            case "section-prefix": return this.readSectionByPrefix(source.path, source.prefix);
            case "block": return this.readBlock(source.path, source.startMarker, source.endMarker);
            default: throw new Error("未知 worker source 类型：" + source.kind);
        }
    }
    readReference(path, section) {
        if (typeof section !== "string" || section.trim() === "")
            return this.read(path);
        const wanted = section.trim();
        try {
            return this.readSection(path, wanted);
        }
        catch (error) {
            return this.readSectionByPrefix(path, wanted);
        }
    }
}
//# sourceMappingURL=source.js.map
