"use client";

import Image from "next/image";
import type { WikipediaSource } from "@/server/wikipediaSources";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronUpIcon } from "@heroicons/react/20/solid";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

export const WikipediaLinks = ({ sources }: { sources?: WikipediaSource[] }) => {
  if (!sources?.length) return null;
  const primary =
    sources.find(({ url }) => new URL(url).hostname === "en.wikipedia.org") ?? sources[0];
  return (
    <footer className="flex flex-wrap items-center justify-between gap-x-3 border-t border-zinc-200 pt-2 text-sm">
      <a
        href={primary.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${primary.title} on Wikipedia (opens in a new tab)`}
        className="inline-flex min-h-8 items-center rounded-sm text-zinc-500 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 pointer-coarse:min-h-11"
      >
        <Image
          src="/icons/wikipedia-w.svg"
          alt=""
          width={28}
          height={28}
          className="mr-1 shrink-0"
        />
        Read on Wikipedia
        <ArrowTopRightOnSquareIcon className="ml-1.5 size-3.5" aria-hidden="true" />
      </a>
      {sources.length > 1 ? (
        <Menu as="div">
          <MenuButton className="inline-flex min-h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-xs inset-ring-1 inset-ring-zinc-300 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 pointer-coarse:min-h-11">
            Other languages
            <ChevronUpIcon className="size-5 text-zinc-500" aria-hidden="true" />
          </MenuButton>
          <MenuItems
            anchor="top"
            modal={false}
            transition
            className="z-50 w-(--button-width) origin-bottom overflow-y-auto rounded-md bg-white py-1 shadow-lg outline-1 outline-black/5 transition [--anchor-gap:0.5rem] focus:outline-none data-closed:scale-95 data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in motion-reduce:transition-none"
          >
            {sources
              .filter(({ url }) => url !== primary.url)
              .map(({ title, url }) => (
                <MenuItem key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${title} on Wikipedia (opens in a new tab)`}
                    className="flex items-center justify-between gap-2 px-4 py-2 text-sm text-zinc-700 data-focus:bg-zinc-100 data-focus:text-zinc-900 data-focus:outline-hidden pointer-coarse:min-h-11"
                  >
                    {new Intl.DisplayNames(["en"], { type: "language" }).of(
                      new URL(url).hostname.split(".")[0],
                    )}
                    <ArrowTopRightOnSquareIcon
                      className="size-3.5 shrink-0 text-zinc-400"
                      aria-hidden="true"
                    />
                  </a>
                </MenuItem>
              ))}
          </MenuItems>
        </Menu>
      ) : null}
    </footer>
  );
};
