"use client";

import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useId } from "react";

const sizes = {
  small: "p-1",
  medium: "p-1.5",
  large: "p-2",
} as const;

const tones = {
  primary: "bg-brand text-zinc-950 focus-visible:outline-focus",
  secondary:
    "border border-line-strong bg-surface text-ink hover:bg-surface-muted focus-visible:outline-focus",
  danger:
    "bg-red-700 text-white hover:bg-red-600 focus-visible:outline-red-700 dark:bg-red-600 dark:hover:bg-red-500 dark:focus-visible:outline-red-600",
} as const;

export const IconButton = ({
  children,
  className,
  label,
  size = "medium",
  tone = "secondary",
  type = "button",
  ...props
}: {
  children: ReactNode;
  label: string;
  size?: keyof typeof sizes;
  tone?: keyof typeof tones;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "size">) => {
  const tooltipId = useId();
  const tooltip = props.title ?? label;

  return (
    <span className="group relative inline-flex">
      <button
        {...props}
        type={type}
        aria-label={label}
        aria-describedby={tooltipId}
        className={clsx(
          "inline-flex cursor-pointer items-center justify-center rounded-full shadow-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-none [&_svg]:size-5 [&_svg]:shrink-0",
          sizes[size],
          tones[tone],
          className,
        )}
      >
        <span aria-hidden="true">{children}</span>
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded bg-zinc-900 px-2 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-md transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
      >
        {tooltip}
      </span>
    </span>
  );
};
