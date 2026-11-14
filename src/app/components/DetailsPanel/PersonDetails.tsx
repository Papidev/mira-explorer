import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import type { PublicPerson } from "@/server/person";
import { Person } from "@/app/components/Person";
import { Heading } from "./Heading";

/** A Person profile, optionally opened from a place it can return to. */
export const PersonDetails = ({
  person,
  isLoading,
  loadingName,
  placeName,
  onBack,
}: {
  person: PublicPerson | null;
  isLoading: boolean;
  /** Name from the place's Story, shown while the profile loads. */
  loadingName?: string;
  placeName?: string;
  onBack: () => void;
}) => (
  <>
    <Heading
      before={
        placeName ? (
          <button
            type="button"
            onClick={onBack}
            className="text-ink-muted hover:text-ink focus-visible:outline-focus mb-3 inline-flex max-w-full cursor-pointer items-center gap-2 rounded-sm py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            <ArrowLeftIcon className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">Back to {placeName}</span>
          </button>
        ) : null
      }
    >
      {person?.name ??
        (isLoading
          ? (loadingName ?? (
              <span
                aria-hidden="true"
                className="bg-surface-muted block h-7 w-48 animate-pulse rounded-sm motion-reduce:animate-none"
              />
            ))
          : "Person")}
    </Heading>
    <div className="text-ink px-5 pt-2 pb-4 text-sm/6">
      {isLoading ? null : person ? (
        <Person person={person} />
      ) : (
        <p className="text-ink-muted">This person is unavailable.</p>
      )}
    </div>
  </>
);
