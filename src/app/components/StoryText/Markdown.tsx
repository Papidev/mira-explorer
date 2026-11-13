import ReactMarkdown from "react-markdown";
import type { Root } from "mdast";

export const Markdown = ({
  text,
  tree,
  inline = false,
  onOpenPerson,
}: {
  text: string;
  tree?: Root;
  inline?: boolean;
  onOpenPerson?: (personId: string) => void;
}) => {
  const rendered = (
    <ReactMarkdown
      remarkPlugins={tree ? [() => () => tree] : []}
      allowedElements={[
        "p",
        "strong",
        "em",
        "a",
        "ul",
        "ol",
        "li",
        "blockquote",
        "br",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
      ]}
      unwrapDisallowed
      components={{
        ...(inline ? { p: ({ children }) => <>{children}</> } : {}),
        strong: ({ children }) => (
          <strong className="text-story-emphasis font-semibold">{children}</strong>
        ),
        a: ({ node, children, href }) => {
          const personId = node?.properties["data-person-id"];
          return (
            <a
              href={href}
              onClick={
                typeof personId === "string" && onOpenPerson
                  ? (event) => {
                      event.preventDefault();
                      onOpenPerson(personId);
                    }
                  : undefined
              }
              className="text-link decoration-link-line hover:text-link-hover focus-visible:outline-link cursor-pointer font-semibold underline underline-offset-4 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {children}
            </a>
          );
        },
        h1: ({ children }) => <h4 className="text-ink text-lg font-semibold">{children}</h4>,
        h2: ({ children }) => <h4 className="text-ink text-lg font-semibold">{children}</h4>,
        h3: ({ children }) => <h4 className="text-ink font-semibold">{children}</h4>,
        h4: ({ children }) => <h4 className="text-ink font-semibold">{children}</h4>,
        h5: ({ children }) => <h5 className="text-ink font-semibold">{children}</h5>,
        h6: ({ children }) => <h6 className="text-ink font-semibold">{children}</h6>,
      }}
    >
      {text}
    </ReactMarkdown>
  );
  return inline ? (
    rendered
  ) : (
    <div className="prose prose-zinc dark:prose-invert prose-headings:font-serif prose-headings:tracking-tight prose-a:cursor-pointer prose-a:text-link prose-a:decoration-link-line prose-a:underline-offset-4 prose-a:hover:text-link-hover prose-blockquote:border-brand prose-li:marker:text-ink-muted text-ink max-w-none text-base/7 [&_ul>li]:marker:text-2xl">
      {rendered}
    </div>
  );
};
