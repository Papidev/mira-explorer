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
      className={`group-hover:bg-surface-muted flex size-7 items-center justify-center rounded-md ${transparent ? "" : "bg-surface"}`}
    >
      <XMarkIcon aria-hidden="true" strokeWidth={2} className="size-5" />
    </span>
  </button>
);
