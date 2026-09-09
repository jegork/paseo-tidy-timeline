# tidy-timeline

A Paseo plugin that folds noisy user messages into compact cards.

- **Skill card** — omp expands `/skill:name` into the user turn as the command line, a marker
  sentence, and the whole SKILL.md. The card shows `Skill · name · args` with a line count; tap to
  expand the body, copy it from the footer.
- **Paste card** — a user message with 24 or more lines, or 4000 or more characters, is almost
  certainly pasted output. The card shows the first three lines and a "more lines" bar with
  Show all and Copy. ANSI colour codes are stripped and the bar says so.

Client-only. Nothing runs on the daemon and nothing is stored.

```bash
paseo plugin install /absolute/path/to/paseo-tidy-timeline
```

Requires Paseo 0.8.
