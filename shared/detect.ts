/**
 * Pure recognisers for user messages the timeline should not show verbatim.
 * No React, no Node: the client transformer and the tests share this file.
 */

export type SkillInvocation = {
  name: string;
  args: string;
  body: string;
};

// omp expands `/skill:name args` into the user turn as the command line, a
// marker sentence, then the whole SKILL.md; the model reads the same text
const SKILL_LINE = /^\/skill:([A-Za-z0-9_.-]+)(?:[ \t]+(.*))?$/;
const SKILL_MARKER =
  /^\[IMPORTANT: User invoked the "([^"]+)" skill; follow its instructions\. Full skill below\.\]$/;

export function parseSkillInvocation(text: string): SkillInvocation | null {
  const lines = text.split("\n");
  const command = SKILL_LINE.exec(lines[0] ?? "");
  if (command === null) return null;
  const markerIndex = lines.findIndex((line, index) => index > 0 && SKILL_MARKER.test(line));
  if (markerIndex === -1) return null;
  const marker = SKILL_MARKER.exec(lines[markerIndex] ?? "");
  if (marker === null || marker[1] !== command[1]) return null;
  return {
    name: command[1] ?? "",
    args: (command[2] ?? "").trim(),
    body: lines
      .slice(markerIndex + 1)
      .join("\n")
      .trim(),
  };
}

// CSI sequences (colour, cursor) and OSC sequences (titles, hyperlinks)
const ANSI = /\x1b\[[0-?]*[ -/]*[@-~]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g;

export function stripAnsi(text: string): string {
  return text.replace(ANSI, "");
}

export type LongPaste = {
  preview: string;
  text: string;
  lineCount: number;
  hadAnsi: boolean;
};

export const LONG_PASTE_MIN_LINES = 24;
export const LONG_PASTE_MIN_CHARS = 4000;
export const PREVIEW_LINES = 3;

/**
 * A message long enough that it is almost certainly pasted output rather than
 * something typed. The preview keeps the first few lines so the reader still
 * sees what was pasted without the whole log unrolled in the thread.
 */
export function detectLongPaste(text: string): LongPaste | null {
  const hadAnsi = ANSI.test(text);
  ANSI.lastIndex = 0;
  const clean = hadAnsi ? stripAnsi(text) : text;
  const lines = clean.split("\n");
  if (lines.length < LONG_PASTE_MIN_LINES && clean.length < LONG_PASTE_MIN_CHARS) return null;
  return {
    preview: lines.slice(0, PREVIEW_LINES).join("\n"),
    text: clean,
    lineCount: lines.length,
    hadAnsi,
  };
}
