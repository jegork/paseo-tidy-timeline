import type { PluginTimelineItemProps } from "@getpaseo/plugin/client";
import { Icon } from "@getpaseo/plugin/client/react-native";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { z } from "zod";

export const mountCardSchema = z.object({
  tools: z.array(z.string()),
});

type MountCardData = z.output<typeof mountCardSchema>;

/** One muted line per mount notice, expandable to the tool names. */
export function MountCard({ item, theme }: PluginTimelineItemProps<MountCardData>) {
  const [open, setOpen] = useState(false);
  const styles = useMemo(
    () => ({
      row: { flexDirection: "row" as const, alignItems: "center" as const, gap: 6, paddingVertical: 2 },
      muted: { color: theme.colors.foregroundMuted, fontSize: 12 },
      list: { color: theme.colors.foregroundMuted, fontSize: 12, fontFamily: "monospace", paddingLeft: 20 },
    }),
    [theme],
  );
  const count = item.data.tools.length;
  return (
    <View>
      <Pressable accessibilityRole="button" onPress={() => setOpen((value) => !value)} style={styles.row}>
        <Icon name="Plug" size={12} color={theme.colors.foregroundMuted} />
        <Text style={styles.muted}>{`Mounted ${count} ${count === 1 ? "tool" : "tools"}`}</Text>
        <Icon name={open ? "ChevronDown" : "ChevronRight"} size={12} color={theme.colors.foregroundMuted} />
      </Pressable>
      {open ? (
        <Text selectable style={styles.list}>
          {item.data.tools.join("\n")}
        </Text>
      ) : null}
    </View>
  );
}
