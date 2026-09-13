import type { PluginClientContext } from "@getpaseo/plugin/client";
import { MountCard, mountCardSchema } from "./client/mount-card";
import { PasteCard, pasteCardSchema } from "./client/paste-card";
import { SkillCard, skillCardSchema } from "./client/skill-card";
import {
  detectLongPaste,
  parseSkillBody,
  parseSkillInvocation,
  parseToolMount,
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
  client.addTimelineTransformer({
    id: "tidy-notification",
    query: { itemType: "notification" },
    transform({ item }) {
      const mount = parseToolMount(item.message);
      if (mount === null) return undefined;
      return { items: [{ type: "plugin", kind: "mount-card", version: 1, data: mount }] };
    },
  });
  client.addTimelineRenderer({ kind: "skill-card", version: 1, schema: skillCardSchema, Component: SkillCard });
  client.addTimelineRenderer({ kind: "paste-card", version: 1, schema: pasteCardSchema, Component: PasteCard });
  client.addTimelineRenderer({ kind: "mount-card", version: 1, schema: mountCardSchema, Component: MountCard });
  return () => {};
}
