import type { PhrasingContent, RootContent } from "mdast";
import type { PublicStoryContent } from "@/server/storyWorkflow";
import { createTextTree } from "./textTree";

export const useStoryText = (
  content: PublicStoryContent,
  history: PublicStoryContent["topics"]["history"],
  linkPeople: boolean,
) => {
  const linked = new Set<string>();
  const people = content.relatedPeople
    .filter((person) => linkPeople && person.personId && person.name.trim())
    .sort((left, right) => right.name.length - left.name.length);

  const transform = (node: RootContent): RootContent[] => {
    // Existing links, code, and HTML keep their original content and destination.
    if (node.type === "link" || node.type === "linkReference") return [node];
    if (node.type === "text") {
      const parts: PhrasingContent[] = [];
      let cursor = 0;
      while (cursor < node.value.length) {
        const match = people
          .filter(({ personId }) => !linked.has(personId!))
          .map((person) => {
            let start = node.value.indexOf(person.name, cursor);
            while (
              start >= 0 &&
              (/[\p{L}\p{N}_]/u.test(node.value[start - 1] ?? "") ||
                /[\p{L}\p{N}_]/u.test(node.value[start + person.name.length] ?? ""))
            )
              start = node.value.indexOf(person.name, start + 1);
            return { ...person, start };
          })
          .filter((person) => person.start >= 0)
          .sort((left, right) => left.start - right.start)[0];
        if (!match) break;
        const start = match.start;
        if (start > cursor) parts.push({ type: "text", value: node.value.slice(cursor, start) });
        parts.push({
          type: "link",
          url: `#person-${encodeURIComponent(match.personId!)}`,
          data: { hProperties: { "data-person-id": match.personId! } },
          children: [{ type: "text", value: match.name }],
        });
        linked.add(match.personId!);
        cursor = start + match.name.length;
      }
      if (cursor < node.value.length) parts.push({ type: "text", value: node.value.slice(cursor) });
      return parts;
    }
    if ("children" in node) {
      node.children = node.children.flatMap(transform) as typeof node.children;
      // Lift links out of bold phrases so their names use only the Person link styling.
      if (node.type === "strong") {
        return node.children.flatMap((child): PhrasingContent[] =>
          child.type === "link" || child.type === "linkReference"
            ? [child]
            : [{ ...node, children: [child] }],
        );
      }
    }
    return [node];
  };

  const prepare = (text: string, emphasis?: string[]) => {
    const tree = createTextTree(text, emphasis, content.textFormat);
    if (people.length) tree.children = tree.children.flatMap(transform);
    return { text, tree };
  };

  return {
    introduction: (content.textFormat === "markdown"
      ? [content.introduction]
      : content.introduction
          .split(/\r?\n\s*\r?\n/)
          .map((text) => text.trim())
          .filter(Boolean)
    ).map((text) => prepare(text, content.introductionEmphasis)),
    history: history.map(({ description, emphasis }) => prepare(description, emphasis)),
    design: content.topics.design.map(({ description, emphasis }) =>
      prepare(description, emphasis),
    ),
    art: content.topics.art.map(({ description, emphasis }) => prepare(description, emphasis)),
  };
};
