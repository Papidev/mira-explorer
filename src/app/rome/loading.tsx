import { RomeHeader } from "./RomeHeader";

const Loading = () => (
  <main className="bg-canvas text-ink flex h-dvh flex-col">
    <RomeHeader />
    <div className="grid flex-1 place-items-center">
      <div role="status">
        <span
          aria-hidden="true"
          className="border-accent/20 border-t-accent block size-8 animate-spin rounded-full border-3 motion-reduce:animate-none"
        />
        <span className="sr-only">Loading the map…</span>
      </div>
    </div>
  </main>
);

export default Loading;
