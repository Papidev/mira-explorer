import { Spinner } from "@/app/components/ui/Spinner";
import { RomeHeader } from "./RomeHeader";

const Loading = () => (
  <main className="bg-canvas text-ink flex h-dvh flex-col">
    <RomeHeader />
    <div className="grid flex-1 place-items-center">
      <div role="status">
        <Spinner />
        <span className="sr-only">Loading the map…</span>
      </div>
    </div>
  </main>
);

export default Loading;
