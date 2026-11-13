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
    <footer className="border-line flex flex-wrap items-center justify-between gap-x-3 border-t pt-2 text-sm">
      <a
        href={primary.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${primary.title} on Wikipedia (opens in a new tab)`}
        className="text-ink-subtle inline-flex min-h-8 items-center rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 pointer-coarse:min-h-11"
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
          <MenuButton className="bg-surface text-ink inset-ring-line-strong hover:bg-canvas inline-flex min-h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold shadow-xs inset-ring-1 focus-visible:outline-2 focus-visible:outline-offset-2 pointer-coarse:min-h-11">
            Other languages
            <ChevronUpIcon className="text-ink-subtle size-5" aria-hidden="true" />
          </MenuButton>
          <MenuItems
            anchor="top"
            modal={false}
            transition
            className="bg-surface z-50 w-(--button-width) origin-bottom overflow-y-auto rounded-md py-1 shadow-lg outline-1 outline-black/5 transition [--anchor-gap:0.5rem] focus:outline-none data-closed:scale-95 data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in motion-reduce:transition-none"
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
                    className="text-ink-muted data-focus:bg-surface-muted data-focus:text-ink flex items-center justify-between gap-2 px-4 py-2 text-sm data-focus:outline-hidden pointer-coarse:min-h-11"
                  >
                    {new Intl.DisplayNames(["en"], { type: "language" }).of(
                      new URL(url).hostname.split(".")[0],
                    )}
                    <ArrowTopRightOnSquareIcon
                      className="text-ink-subtle size-3.5 shrink-0"
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
