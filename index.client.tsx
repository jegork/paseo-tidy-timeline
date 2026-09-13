import type { PluginClientContext } from "@getpaseo/plugin/client";
import { InboxCard, inboxCardSchema } from "./client/inbox-card";
import { PasteCard, pasteCardSchema } from "./client/paste-card";
import { SkillCard, skillCardSchema } from "./client/skill-card";
import {
  detectLongPaste,
  parseIrcInbox,
  parseSkillBody,
  parseSkillInvocation,
} from "./shared/detect";

export default function contribute(client: PluginClientContext) {
  client.addTimelineTransformer({
    id: "tidy-user-message",
    query: { itemType: "user_message" },
    transform({ item }) {
      const skill = parseSkillInvocation(item.text);
      if (skill !== null) {
        return {
          items: [{ type: "plugin", kind: "skill-card", version: 1, data: { ...skill, origin: "user" } }],
        };
      }
      const paste = detectLongPaste(item.text);
      if (paste !== null) {
        return { items: [{ type: "plugin", kind: "paste-card", version: 1, data: paste }] };
      }
      return undefined;
    },
  });
  // paseo's omp mapper hands the injected skill over as an assistant row
  client.addTimelineTransformer({
    id: "tidy-assistant-message",
    query: { itemType: "assistant_message" },
    transform({ item }) {
      const inbox = parseIrcInbox(item.text);
      if (inbox !== null) {
        return { items: [{ type: "plugin", kind: "inbox-card", version: 1, data: inbox }] };
      }
      const skill = parseSkillBody(item.text);
      if (skill === null) return undefined;
      return {
        items: [
          {
            type: "plugin",
            kind: "skill-card",
            version: 1,
            data: { name: skill.name, args: "", body: skill.body, origin: "assistant" },
          },
        ],
      };
    },
  });
  client.addTimelineRenderer({ kind: "skill-card", version: 1, schema: skillCardSchema, Component: SkillCard });
  client.addTimelineRenderer({ kind: "paste-card", version: 1, schema: pasteCardSchema, Component: PasteCard });
  client.addTimelineRenderer({ kind: "inbox-card", version: 1, schema: inboxCardSchema, Component: InboxCard });
  return () => {};
}
