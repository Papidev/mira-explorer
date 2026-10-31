import type { HistoryInsight, PublicStoryContent } from "@/server/storyWorkflow";
import { Topic } from "@/app/components/Topic/Topic";
import { useStoryText } from "@/app/components/StoryText/useStoryText";
import { StoryText } from "@/app/components/StoryText";
import { WikipediaLinks } from "@/app/components/WikipediaLinks";

const toOrdinal = (value: number) => {
  const remainder = value % 100;
  if (remainder >= 11 && remainder <= 13) {
    return `${value}th`;
  }
  return `${value}${value % 10 === 1 ? "st" : value % 10 === 2 ? "nd" : value % 10 === 3 ? "rd" : "th"}`;
};

const formatYearRange = (startYear: number, endYear?: number) => {
  if (endYear === undefined || endYear === startYear) {
    return `${Math.abs(startYear)} ${startYear < 0 ? "BC" : "AD"}`;
  }
  if (startYear < 0 && endYear < 0) {
    return `${Math.abs(startYear)}–${Math.abs(endYear)} BC`;
  }
  if (startYear > 0 && endYear > 0) {
    return `${startYear}–${endYear} AD`;
  }
  return `${Math.abs(startYear)} BC–${endYear} AD`;
};

const formatCenturyRange = (startYear: number, endYear: number) => {
  const startCentury = Math.ceil(Math.abs(startYear) / 100);
  const endCentury = Math.ceil(Math.abs(endYear) / 100);
  if (startYear < 0 === endYear < 0) {
    return `${toOrdinal(startCentury)}${
      startCentury === endCentury ? "" : `–${toOrdinal(endCentury)}`
    } century ${startYear < 0 ? "BC" : "AD"}`;
  }
  return `${toOrdinal(startCentury)} century BC–${toOrdinal(endCentury)} century AD`;
};

const formatHistoricalTime = (time: NonNullable<HistoryInsight["time"]>) =>
  `${time.precision === "approximate" ? "c. " : ""}${
    time.granularity === "century"
      ? formatCenturyRange(time.startYear, time.endYear ?? time.startYear)
      : formatYearRange(time.startYear, time.endYear)
  }`;

export const StoryContent = ({
  content,
  period,
  onOpenPerson,
}: {
  content: PublicStoryContent;
  period?: string;
  onOpenPerson?: (personId: string) => void;
}) => {
  const history = [...content.topics.history].sort((left, right) => {
    if (!left.time && !right.time) return 0;
    if (!left.time) return 1;
    if (!right.time) return -1;
    return left.time.startYear - right.time.startYear;
  });

  const text = useStoryText(content, history, Boolean(onOpenPerson));

  return (
    <div className="space-y-6 text-base/7 text-zinc-800">
      {content.textFormat === "markdown" ? (
        <StoryText
          {...text.introduction[0]}
          textFormat={content.textFormat}
          onOpenPerson={onOpenPerson}
        />
      ) : (
        <div className="space-y-4">
          {text.introduction.map((paragraph, index) => (
            <p key={index} className="whitespace-pre-line">
              <StoryText {...paragraph} onOpenPerson={onOpenPerson} />
            </p>
          ))}
        </div>
      )}
      {period ? (
        <dl className="grid gap-2 rounded-lg bg-amber-50 p-3 text-sm/6">
          <div>
            <dt className="font-semibold text-zinc-950">Period</dt>
            <dd>{period}</dd>
          </div>
        </dl>
      ) : null}
      {history.length > 0 ? (
        <section className="rounded-xl bg-orange-50/55 px-4 py-3 ring-1 ring-orange-950/5">
          <h3 className="flex items-baseline gap-2 text-lg/6 font-semibold tracking-wide text-zinc-950 uppercase">
            <span
              aria-hidden="true"
              className="size-5 shrink-0 bg-current mask-[url(/icons/story/scroll.svg)] mask-contain mask-bottom mask-no-repeat text-orange-700"
            />
            History
          </h3>
          <ol role="list" className="mt-4 list-none">
            {history.map(({ time }, index) => (
              <li key={`history-${index}`} className="relative pb-6 pl-6 last:pb-0">
                {index < history.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-2 left-1 h-full w-0.5 bg-orange-200"
                  />
                ) : null}
                <span
                  aria-hidden="true"
                  className={`absolute top-2 left-0 size-2.5 rounded-full ${time ? "bg-orange-700" : "border-2 border-orange-700 bg-orange-50"}`}
                />
                {time ? (
                  <p className="text-sm/6 font-semibold text-orange-700">
                    {formatHistoricalTime(time)}
                  </p>
                ) : null}
                {content.textFormat === "markdown" ? (
                  <StoryText
                    {...text.history[index]}
                    textFormat={content.textFormat}
                    onOpenPerson={onOpenPerson}
                  />
                ) : (
                  <p>
                    <StoryText {...text.history[index]} onOpenPerson={onOpenPerson} />
                  </p>
                )}
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      <Topic
        title="Architecture"
        insights={text.design.map((paragraph, index) => (
          <StoryText
            key={index}
            {...paragraph}
            onOpenPerson={onOpenPerson}
            textFormat={content.textFormat}
          />
        ))}
      />
      <Topic
        title="Art"
        insights={text.art.map((paragraph, index) => (
          <StoryText
            key={index}
            {...paragraph}
            onOpenPerson={onOpenPerson}
            textFormat={content.textFormat}
          />
        ))}
      />
      {content.relatedPeople.length > 0 ? (
        <section className="rounded-xl bg-sky-50/55 px-4 py-3 ring-1 ring-sky-950/5">
          <h3 className="text-lg/6 font-semibold tracking-wide text-zinc-950 uppercase">
            Related People
          </h3>
          <ul className="mt-3 space-y-3">
            {content.relatedPeople.map(({ name, personId }, index) => (
              <li
                key={personId ?? `${name}-${index}`}
                className="relative pl-5 before:absolute before:top-0 before:left-1 before:text-2xl before:leading-7 before:font-semibold before:text-sky-700 before:content-['•']"
              >
                {personId && onOpenPerson ? (
                  <button
                    type="button"
                    onClick={() => onOpenPerson(personId)}
                    className="cursor-pointer font-semibold text-sky-800 underline decoration-sky-300 underline-offset-4 hover:text-sky-950"
                  >
                    {name}
                  </button>
                ) : (
                  <span className="font-semibold text-zinc-950">{name}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <WikipediaLinks sources={content.wikipediaSources} />
    </div>
  );
};
