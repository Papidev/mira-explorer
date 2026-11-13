import { useState } from "react";
import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions, Label } from "@headlessui/react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import type { Poi } from "@/types/Poi";

export const Search = ({ pois, onSelect }: { pois: Poi[]; onSelect: (poi: Poi) => void }) => {
  const [query, setQuery] = useState("");
  const matches = query.trim()
    ? pois.filter((poi) =>
        poi.name
          .normalize("NFD")
          .replace(/\p{M}/gu, "")
          .toLowerCase()
          .includes(query.trim().normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()),
      )
    : [];

  return (
    <Combobox
      as="div"
      value={null}
      onChange={(poi: Poi | null) => {
        if (poi) onSelect(poi);
        setQuery("");
      }}
      onClose={() => setQuery("")}
    >
      <Label className="text-ink block text-sm font-semibold">Search</Label>
      <div className="relative mt-2">
        <MagnifyingGlassIcon
          aria-hidden="true"
          className="text-ink-subtle pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
        <ComboboxInput
          autoComplete="off"
          placeholder="Search by name"
          displayValue={() => ""}
          onChange={(event) => setQuery(event.target.value)}
          className="bg-surface text-ink outline-line-strong placeholder:text-ink-subtle focus:outline-accent block min-h-11 w-full rounded-lg py-2.5 pr-3 pl-9 text-base outline-1 -outline-offset-1 focus:outline-2 focus:-outline-offset-2 sm:text-sm md:min-h-9 md:py-2"
        />
      </div>
      <ComboboxOptions
        anchor="bottom start"
        className="border-line bg-surface z-50 max-h-72 w-(--input-width) overflow-y-auto rounded-lg border p-1 shadow-lg [--anchor-gap:0.25rem] empty:invisible"
      >
        {query.trim() && !matches.length && (
          <p className="text-ink-subtle px-3 py-3 text-sm">No places match your search.</p>
        )}
        {matches.map((poi) => (
          <ComboboxOption
            key={poi.id}
            value={poi}
            className="group text-ink data-focus:bg-brand-soft cursor-pointer rounded-md px-3 py-2.5 select-none data-focus:outline-hidden"
          >
            <span className="block text-sm font-medium">{poi.name}</span>
            {poi.address && (
              <span className="text-ink-subtle mt-1 block text-xs">{poi.address}</span>
            )}
          </ComboboxOption>
        ))}
      </ComboboxOptions>
    </Combobox>
  );
};
