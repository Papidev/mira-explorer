"use client";

export const Toggle = ({
  checked,
  description,
  id,
  label,
  name,
  onChange,
}: {
  checked: boolean;
  description: string;
  id: string;
  label: string;
  name: string;
  onChange: (checked: boolean) => void;
}) => (
  <div className="flex items-center justify-between gap-3">
    <div className="group outline-accent has-checked:bg-atlas relative inline-flex w-11 shrink-0 rounded-full bg-zinc-200 p-0.5 inset-ring inset-ring-zinc-900/5 outline-offset-2 transition-colors duration-200 ease-in-out has-focus-visible:outline-2 dark:bg-white/5 dark:inset-ring-white/10 dark:outline-blue-300 dark:has-checked:bg-blue-300">
      <span className="bg-surface size-5 rounded-full shadow-xs ring-1 ring-zinc-900/5 transition-transform duration-200 ease-in-out group-has-checked:translate-x-5" />
      <input
        id={id}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-description`}
        className="absolute inset-0 size-full cursor-pointer appearance-none focus:outline-hidden"
      />
    </div>
    <div className="text-sm">
      <label id={`${id}-label`} htmlFor={id} className="text-ink cursor-pointer font-medium">
        {label}
      </label>{" "}
      <span id={`${id}-description`} className="text-ink-subtle">
        {description}
      </span>
    </div>
  </div>
);
