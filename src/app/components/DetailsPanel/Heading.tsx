import type { ReactNode } from "react";

/**
 * Panel title with the brand underline; `before` sits above it, such as a Back link.
 * The panel moves focus here when its content opens.
 */
export const Heading = ({ before, children }: { before?: ReactNode; children: ReactNode }) => (
  <div className="px-5 py-4 pr-16">
    {before}
    <h2 tabIndex={-1} className="text-ink font-serif text-2xl/7 tracking-tight outline-none">
      {children}
    </h2>
    <span aria-hidden="true" className="bg-brand mt-3 block h-1 w-10 rounded-full" />
  </div>
);
