/** Decorative spinning ring; pair it with a `role="status"` label for screen readers. */
export const Spinner = () => (
  <span
    aria-hidden="true"
    className="border-accent/20 border-t-accent block size-8 animate-spin rounded-full border-3 motion-reduce:animate-none"
  />
);
