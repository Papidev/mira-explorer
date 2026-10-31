import type { ReactNode } from "react";
import type { Root } from "mdast";
import { Markdown } from "./Markdown";

export const StoryText = ({
  text,
  emphasis = [],
  textFormat,
  tree,
  onOpenPerson,
}: {
  text: string;
  emphasis?: string[];
  textFormat?: "markdown";
  tree?: Root;
  onOpenPerson?: (personId: string) => void;
}) => {
  if (tree || textFormat === "markdown")
    return (
      <Markdown
        text={text}
        tree={tree}
        inline={textFormat !== "markdown"}
        onOpenPerson={onOpenPerson}
      />
    );
  const parts: ReactNode[] = [];
  let cursor = 0;

  for (const { phrase, start } of emphasis
    .map((phrase) => ({ phrase, start: text.indexOf(phrase) }))
    .filter(({ phrase, start }) => phrase.length > 0 && start >= 0)
    .sort((left, right) => left.start - right.start || right.phrase.length - left.phrase.length)) {
    if (start < cursor) continue;
    parts.push(text.slice(cursor, start));
    parts.push(
      <strong key={start} className="font-semibold text-sky-800">
        {phrase}
      </strong>,
    );
    cursor = start + phrase.length;
  }

  parts.push(text.slice(cursor));
  return <>{parts}</>;
};
