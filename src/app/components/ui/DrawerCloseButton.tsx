import { XMarkIcon } from "@heroicons/react/24/outline";

export const DrawerCloseButton = ({
  label = "Close",
  onClick,
  transparent = false,
}: {
  label?: string;
  onClick: () => void;
  transparent?: boolean;
}) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    className="group text-accent focus-visible:outline-accent hover:text-ink flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2"
  >
    <span
      className={`group-hover:bg-surface-muted flex items-center justify-center ${
        // Opaque buttons float over scrolling content, so they need to read as a separate layer.
        transparent
          ? "size-7 rounded-md"
          : "bg-surface ring-line-strong size-8 rounded-full shadow-md ring-1"
      }`}
    >
      <XMarkIcon aria-hidden="true" strokeWidth={2} className="size-5" />
    </span>
  </button>
);
