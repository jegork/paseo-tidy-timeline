import type { PluginClientContext } from "@getpaseo/plugin/client";
import { PasteCard, pasteCardSchema } from "./client/paste-card";
import { SkillCard, skillCardSchema } from "./client/skill-card";
import { detectLongPaste, parseSkillInvocation } from "./shared/detect";

export default function contribute(client: PluginClientContext) {
  client.addTimelineTransformer({
    id: "tidy-user-message",
    query: { itemType: "user_message" },
    transform({ item }) {
      const skill = parseSkillInvocation(item.text);
      if (skill !== null) {
        return { items: [{ type: "plugin", kind: "skill-card", version: 1, data: skill }] };
      }
      const paste = detectLongPaste(item.text);
      if (paste !== null) {
        return { items: [{ type: "plugin", kind: "paste-card", version: 1, data: paste }] };
      }
      return undefined;
    },
  });
  client.addTimelineRenderer({
    kind: "skill-card",
    version: 1,
    schema: skillCardSchema,
    Component: SkillCard,
  });
  client.addTimelineRenderer({
    kind: "paste-card",
    version: 1,
    schema: pasteCardSchema,
    Component: PasteCard,
  });
  return () => {};
}
