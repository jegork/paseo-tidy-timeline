import { describe, expect, test } from "vitest";
import {
  detectLongPaste,
  parseSkillBody,
  parseSkillInvocation,
  parseToolMount,
  stripAnsi,
} from "./detect";

const ESC = "\x1b";

const SKILL_TEXT = [
  "/skill:bossman-diff-review fix/companyid-sql-string",
  '[IMPORTANT: User invoked the "bossman-diff-review" skill; follow its instructions. Full skill below.]',
  "",
  "Two-axis review of the diff between `HEAD` and a fixed point.",
  "",
  "## Process",
].join("\n");

describe("parseSkillInvocation", () => {
  test("splits an omp skill expansion into name, args and body", () => {
    expect(parseSkillInvocation(SKILL_TEXT)).toEqual({
      name: "bossman-diff-review",
      args: "fix/companyid-sql-string",
      body: "Two-axis review of the diff between `HEAD` and a fixed point.\n\n## Process",
    });
  });

  test("accepts an invocation without arguments", () => {
    const text = SKILL_TEXT.replace(
      "/skill:bossman-diff-review fix/companyid-sql-string",
      "/skill:commit",
    ).replace('"bossman-diff-review"', '"commit"');
    expect(parseSkillInvocation(text)).toMatchObject({ name: "commit", args: "" });
  });

  test("leaves a plain message that merely starts with a slash alone", () => {
    expect(parseSkillInvocation("/skill:commit\nplease commit this")).toBeNull();
    expect(parseSkillInvocation("/tdd then carry on")).toBeNull();
  });

  test("ignores a marker whose name does not match the command line", () => {
    const text = SKILL_TEXT.replace('"bossman-diff-review" skill', '"other" skill');
    expect(parseSkillInvocation(text)).toBeNull();
  });

  test("does not fire on a message that only quotes the marker", () => {
    expect(
      parseSkillInvocation(
        'some notes\n[IMPORTANT: User invoked the "x" skill; follow its instructions. Full skill below.]',
      ),
    ).toBeNull();
  });
});

describe("stripAnsi", () => {
  test("removes colour codes and keeps the words", () => {
    expect(stripAnsi(`${ESC}[90m2026-03-24${ESC}[0m ${ESC}[31mERR${ESC}[0m boom`)).toBe(
      "2026-03-24 ERR boom",
    );
  });

  test("removes terminal hyperlinks", () => {
    expect(stripAnsi(`see ${ESC}]8;;https://x.test\x07here${ESC}]8;;\x07`)).toBe("see here");
  });
});

describe("detectLongPaste", () => {
  test("leaves a typed message alone", () => {
    expect(detectLongPaste("carry on")).toBeNull();
    expect(detectLongPaste(Array.from({ length: 23 }, (_, i) => `line ${i}`).join("\n"))).toBeNull();
  });

  test("collapses a message with many lines and keeps a short preview", () => {
    const text = Array.from({ length: 40 }, (_, i) => `line ${i}`).join("\n");
    expect(detectLongPaste(text)).toMatchObject({
      preview: "line 0\nline 1\nline 2",
      lineCount: 40,
      hadAnsi: false,
    });
  });

  test("collapses a single very long line too", () => {
    expect(detectLongPaste("x".repeat(5000))?.lineCount).toBe(1);
  });

  test("strips ansi from both preview and text and says it did", () => {
    const text = Array.from({ length: 30 }, () => `${ESC}[31mERR${ESC}[0m failed`).join("\n");
    const paste = detectLongPaste(text);
    expect(paste?.hadAnsi).toBe(true);
    expect(paste?.preview).toBe("ERR failed\nERR failed\nERR failed");
    expect(paste?.text).not.toContain(ESC);
  });
});

describe("parseSkillBody", () => {
  test("reads the skill omp injects as an assistant row", () => {
    const text =
      '[IMPORTANT: User invoked the "improve-codebase-architecture" skill; follow its instructions. Full skill below.]\n\n# Improve Codebase Architecture\n\nSurface friction.';
    expect(parseSkillBody(text)).toEqual({
      name: "improve-codebase-architecture",
      body: "# Improve Codebase Architecture\n\nSurface friction.",
    });
  });

  test("leaves a reply that quotes the marker later on alone", () => {
    expect(
      parseSkillBody('As the marker said:\n[IMPORTANT: User invoked the "x" skill; follow its instructions. Full skill below.]'),
    ).toBeNull();
  });

  test("leaves an ordinary reply alone", () => {
    expect(parseSkillBody("Bossman, I'll start with the hot spots.")).toBeNull();
  });
});

describe("parseToolMount", () => {
  test("lists the tools an omp extension mounted", () => {
    expect(
      parseToolMount("xd://: mounted mcp__agentmemory_memory_audit, mcp__agentmemory_memory_export"),
    ).toEqual({ tools: ["mcp__agentmemory_memory_audit", "mcp__agentmemory_memory_export"] });
    expect(parseToolMount("xd://: mounted mcp__codegraph_explore")).toEqual({
      tools: ["mcp__codegraph_explore"],
    });
  });

  test("leaves other notifications alone", () => {
    expect(parseToolMount("Rate limited, retrying in 30s")).toBeNull();
    expect(parseToolMount("xd://: mounted ")).toBeNull();
  });
});
