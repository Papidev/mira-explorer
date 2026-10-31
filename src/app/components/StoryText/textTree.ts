import type { PhrasingContent, Root } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";

export const createTextTree = (
  text: string,
  emphasis: string[] = [],
  textFormat?: "markdown",
): Root => {
  if (textFormat === "markdown") return fromMarkdown(text);
  const children: PhrasingContent[] = [];
  let cursor = 0;
  for (const { phrase, start } of emphasis
    .map((phrase) => ({ phrase, start: text.indexOf(phrase) }))
    .filter(({ phrase, start }) => phrase.length > 0 && start >= 0)
    .sort((left, right) => left.start - right.start || right.phrase.length - left.phrase.length)) {
    if (start < cursor) continue;
    children.push({ type: "text", value: text.slice(cursor, start) });
    children.push({ type: "strong", children: [{ type: "text", value: phrase }] });
    cursor = start + phrase.length;
  }
  children.push({ type: "text", value: text.slice(cursor) });
  return { type: "root", children: [{ type: "paragraph", children }] };
};
