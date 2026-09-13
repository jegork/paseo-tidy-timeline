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

export type SkillBody = {
  name: string;
  body: string;
};

/**
 * Paseo's omp mapper emits the injected skill as its own assistant row whose
 * text starts with the marker, separate from the `/skill:` user bubble. The
 * marker must be the first line: a reply that merely quotes it is left alone.
 */
export function parseSkillBody(text: string): SkillBody | null {
  const [first = "", ...rest] = text.split("\n");
  const marker = SKILL_MARKER.exec(first);
  if (marker === null) return null;
  return { name: marker[1] ?? "", body: rest.join("\n").trim() };
}

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

export type IrcMessage = {
  from: string;
  body: string;
};

export type IrcInbox = {
  messages: IrcMessage[];
};

// omp's hub delivers subagent replies into the parent as one assistant row
// made only of <irc> blocks, each with a sender line and delivery boilerplate
const IRC_BLOCK = /<irc>\s*([\s\S]*?)\s*<\/irc>/g;
const IRC_FROM = /^Incoming IRC message from agent ([^\s:]+):\s*/;
const IRC_TRAILER = [
  /^Sent while waiting\/working\..*$/m,
  /^If response expected, reply via hub .*$/m,
];

export function parseIrcInbox(text: string): IrcInbox | null {
  const messages: IrcMessage[] = [];
  let consumed = "";
  for (const match of text.matchAll(IRC_BLOCK)) {
    consumed += match[0];
    const inner = match[1] ?? "";
    const from = IRC_FROM.exec(inner);
    if (from === null) return null;
    let body = inner.slice(from[0].length);
    for (const trailer of IRC_TRAILER) body = body.replace(trailer, "");
    messages.push({ from: from[1] ?? "", body: body.trim() });
  }
  if (messages.length === 0) return null;
  // anything outside the blocks means the model also said something; leave it
  if (text.replace(IRC_BLOCK, "").trim() !== "") return null;
  return { messages };
}
