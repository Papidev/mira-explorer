"use client";

import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { track } from "@vercel/analytics";
import Image from "next/image";
import Link from "next/link";

type Props = {
  // Reported to analytics so we can compare which homepage entry point gets clicked.
  placement: string;
  label?: string;
  size?: "small" | "large";
  className?: string;
};

const sizes = {
  small: "gap-3 px-4 py-2 text-sm",
  large: "gap-6 px-7 py-4 text-base shadow-lg shadow-black/20",
};

export const RomeCta = ({
  placement,
  label = "Explore Rome",
  size = "large",
  className = "",
}: Props) => (
  <Link
    href="/rome"
    onClick={() => track("rome_cta_click", { placement })}
    className={`group bg-brand text-atlas focus-visible:outline-brand inline-flex cursor-pointer items-center rounded-full font-semibold whitespace-nowrap transition-colors hover:bg-yellow-300 focus-visible:outline-2 focus-visible:outline-offset-4 ${sizes[size]} ${className}`}
  >
    <span className="inline-flex items-center gap-4">
      {label}
      {size === "large" && (
        <Image src="/icons/cities/rome-blue.svg" alt="" width={36} height={24} />
      )}
    </span>
    <ArrowRightIcon
      className="size-5 motion-safe:transition-transform motion-safe:group-hover:translate-x-1"
      strokeWidth={2}
      aria-hidden="true"
    />
  </Link>
);
