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
      className="border-brand grid gap-6 border-y-2 py-10 sm:py-14 lg:grid-cols-[1fr_2fr] lg:gap-16"
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
        <dl className="grid gap-7 sm:grid-cols-3 sm:gap-8">
          {[
            { value: 1, label: "City so far, with more to follow" },
            { value: city.pois.length, label: "Places, each with its Story" },
            { value: city.peopleCount ?? 0, label: "Historical figures to discover" },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col-reverse gap-2">
              <dt className="text-ink-muted text-sm/6">{label}</dt>
              <dd className="text-accent font-serif text-4xl/none tracking-tight tabular-nums sm:text-5xl/none">
                {value.toLocaleString("en")}
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-ink-muted mt-8 text-base/7">
          The entire city is there, and you choose what to see. Use the filters to follow your
          interests, one place at a time.
        </p>
        <RomeCta placement="numbers" label="Start with Rome" className="mt-6" />
      </div>
    </section>
  );
};
