import { connection } from "next/server";
import { RomeCta } from "@/app/components/ui/RomeCta";
import { visitorContent } from "@/server/visitorContent";

// Same online counts as the Rome map header. Hidden when the online read fails.
export const HomeNumbers = async () => {
  await connection();
  const city = await visitorContent.getCity("rome").catch(() => null);
  if (!city) return null;

  return (
    <section
      aria-labelledby="numbers-title"
      className="border-brand grid gap-5 border-y-2 py-8 sm:gap-6 sm:py-14 lg:grid-cols-[1fr_2fr] lg:gap-16"
    >
      <div>
        <p className="text-accent text-xs/5 font-semibold tracking-[0.2em] uppercase">
          Mira in numbers
        </p>
        <h2
          id="numbers-title"
          className="mt-3 max-w-sm font-serif text-3xl tracking-tight sm:text-4xl"
        >
          The <span className="text-story-emphasis italic">whole</span> city, at your own pace.
        </h2>
        <span aria-hidden="true" className="bg-brand mt-3 block h-1 w-10 rounded-full" />
      </div>
      <div>
        {/* Phones keep the three numbers on one row: short labels, columns sized to their content and the space shared evenly between them. */}
        <dl className="flex justify-between gap-4 sm:grid sm:grid-cols-3 sm:gap-8">
          {[
            { value: 1, label: "City so far, with more to follow", short: "City so far" },
            {
              value: city.pois.length,
              label: "Places, each with its Story",
              short: "Places with a Story",
            },
            {
              value: city.peopleCount ?? 0,
              label: "Historical figures to discover",
              short: "Historical figures",
            },
          ].map(({ value, label, short }) => (
            <div key={label} className="flex flex-col-reverse justify-end gap-1.5 sm:gap-2">
              <dt className="text-ink-muted text-xs/5 sm:text-sm/6">
                <span className="sm:hidden">{short}</span>
                <span className="max-sm:hidden">{label}</span>
              </dt>
              <dd className="text-accent font-serif text-3xl/none tracking-tight tabular-nums sm:text-5xl/none">
                {value.toLocaleString("en")}
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-ink-muted mt-6 text-base/7 sm:mt-8">
          The entire city is there, and you choose what to see. Use the filters to follow your
          interests, one place at a time.
        </p>
        <RomeCta placement="numbers" label="Start with Rome" className="mt-6" />
      </div>
    </section>
  );
};
