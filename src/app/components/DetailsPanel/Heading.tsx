import type { ReactNode } from "react";

/** Panel title with the brand underline; `before` sits above it, such as a Back link. */
export const Heading = ({ before, children }: { before?: ReactNode; children: ReactNode }) => (
  <div className="px-5 py-4 pr-16">
    {before}
    <h2 className="text-ink font-serif text-2xl/7 tracking-tight">{children}</h2>
    <span aria-hidden="true" className="bg-brand mt-3 block h-1 w-10 rounded-full" />
  </div>
);
