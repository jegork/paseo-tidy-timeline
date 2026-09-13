import type { PluginClientContext } from "@getpaseo/plugin/client";
import { BannerCard, bannerCardSchema } from "./client/banner-card";
import { InboxCard, inboxCardSchema } from "./client/inbox-card";
import { PasteCard, pasteCardSchema } from "./client/paste-card";
import { SkillCard, skillCardSchema } from "./client/skill-card";
import {
  detectLongPaste,
  isSystemNoticeTrailer,
  parseIrcFragment,
  parseIrcInbox,
  parseSkillBody,
  parseSkillInvocation,
  parseSystemNotice,
} from "./shared/detect";

const HIDE = { items: [] };

function banner(icon: string, title: string, meta: string[] = [], body = "") {
  return { items: [{ type: "plugin" as const, kind: "banner-card", version: 1, data: { icon, title, meta, body } }] };
}

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
  // omp's injected rows reach the timeline as assistant messages; while a
  // message streams, paseo 0.8 hands each markdown block over on its own
  client.addTimelineTransformer({
    id: "tidy-assistant-message",
    query: { itemType: "assistant_message" },
    transform({ item }) {
      const inbox = parseIrcInbox(item.text);
      if (inbox !== null) {
        return { items: [{ type: "plugin", kind: "inbox-card", version: 1, data: inbox }] };
      }
      const fragment = parseIrcFragment(item.text);
      if (fragment !== null) {
        return fragment.kind === "opener" ? banner("Inbox", `Message from ${fragment.from}`) : HIDE;
      }
      const skill = parseSkillBody(item.text);
      if (skill !== null) {
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
      }
      const notice = parseSystemNotice(item.text);
      if (notice !== null) return banner("BellRing", notice.title, notice.meta, notice.body);
      if (isSystemNoticeTrailer(item.text)) return HIDE;
      return undefined;
    },
  });
  client.addTimelineRenderer({ kind: "skill-card", version: 1, schema: skillCardSchema, Component: SkillCard });
  client.addTimelineRenderer({ kind: "paste-card", version: 1, schema: pasteCardSchema, Component: PasteCard });
  client.addTimelineRenderer({ kind: "inbox-card", version: 1, schema: inboxCardSchema, Component: InboxCard });
  client.addTimelineRenderer({ kind: "banner-card", version: 1, schema: bannerCardSchema, Component: BannerCard });
  return () => {};
}
