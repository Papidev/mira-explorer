const MAX_LENGTH = 80;

// Commons "Attribution" is free text and can hold whole usage notes; the linked
// Commons page carries the full credit, so captions show a short excerpt.
export const shortenAttribution = (text: string) => {
  if (text.length <= MAX_LENGTH) return text;
  const cut = text.slice(0, MAX_LENGTH);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > MAX_LENGTH / 2 ? cut.slice(0, lastSpace) : cut).replace(/[\s.,;:·-]+$/, "")}…`;
};

export const ImageAttribution = ({ text }: { text: string }) => {
  const short = shortenAttribution(text);
  return short === text ? text : <span title={text}>{short}</span>;
};
