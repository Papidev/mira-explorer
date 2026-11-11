import { connection } from "next/server";
import { visitorContent } from "@/server/visitorContent";

// Same online counts as the Rome map header. Hidden when the online read fails.
export const HomeNumbers = async () => {
  await connection();
  const city = await visitorContent.getCity("rome").catch(() => null);
  if (!city) return null;

  return (
    <section aria-label="Mira in numbers" className="border-brand border-y-2 py-8">
      <dl className="flex flex-col gap-7 sm:flex-row sm:justify-between sm:gap-8">
        {[
          { value: 1, label: "City so far, with more to follow" },
          { value: city.pois.length, label: "Places, each with its Story" },
          { value: city.peopleCount ?? 0, label: "Historical figures to discover" },
        ].map(({ value, label }) => (
          <div key={label} className="flex flex-col-reverse gap-2">
            <dt className="text-sm/6 text-zinc-600">{label}</dt>
            <dd className="text-atlas font-serif text-4xl/none tracking-tight tabular-nums sm:text-5xl/none">
              {value.toLocaleString("en")}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 text-base/7 text-zinc-600">
        <strong className="font-semibold text-zinc-900">The whole city, never all at once.</strong>{" "}
        Filter the map by what draws you, and explore at your own pace.
      </p>
    </section>
  );
};
