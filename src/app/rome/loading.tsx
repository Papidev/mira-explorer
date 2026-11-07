import { WorkInProgressNotice } from "@/app/components/ui/WorkInProgressNotice";
import { RomeHeader } from "./RomeHeader";

const Loading = () => (
  <main className="flex h-dvh flex-col bg-zinc-50 text-zinc-900">
    <WorkInProgressNotice />
    <RomeHeader />
    <div className="grid flex-1 place-items-center">
      <div role="status">
        <span
          aria-hidden="true"
          className="border-brand/20 border-t-brand block size-8 animate-spin rounded-full border-3 motion-reduce:animate-none"
        />
        <span className="sr-only">Loading the map…</span>
      </div>
    </div>
  </main>
);

export default Loading;
