# tidy-timeline

A Paseo plugin that folds noisy user messages into compact cards.

- **Skill card** — omp expands `/skill:name` into the conversation as a marker sentence followed by
  the whole SKILL.md, which Paseo shows as a reply-sized wall of text. The card shows
  `Skill · name` with a line count; tap to expand the body, copy it from the footer. Both shapes are
  recognised: the body as its own assistant row (what Paseo's omp mapper emits) and the body bundled
  into the user message.
- **Inbox card** — omp's hub delivers subagent replies into the parent as one assistant row of
  `<irc>` blocks. The card lists one collapsed row per message with the sender and a two-line
  preview; tap to read, Copy underneath. The two delivery boilerplate lines are dropped. A reply
  that says anything outside the blocks is left as it is.
- **Paste card** — a user message with 24 or more lines, or 4000 or more characters, is almost
  certainly pasted output. The card shows the first three lines and a "more lines" bar with
  Show all and Copy. ANSI colour codes are stripped and the bar says so.

Client-only. Nothing runs on the daemon and nothing is stored.

```bash
paseo plugin install /absolute/path/to/paseo-tidy-timeline
```

Requires Paseo 0.8. Transformers may only target user, assistant, reasoning, tool-call, todo,
error, and compaction rows, so omp's "mounted tool" notifications stay as they are.
