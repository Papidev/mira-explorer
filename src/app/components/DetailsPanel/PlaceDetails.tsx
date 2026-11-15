"use client";

import { useState } from "react";
import Image from "next/image";
import { PhotoIcon } from "@heroicons/react/24/outline";
import type { Poi } from "@/types/Poi";
import { PoiImageGallery } from "@/app/components/PoiImageGallery";
import { StoryContent } from "@/app/components/StoryContent";
import { ImageAttribution } from "@/app/components/ImageAttribution";
import type { usePoiStoryContent } from "@/app/components/usePoiStoryContent";
import { Heading } from "./Heading";

type StoryState = ReturnType<typeof usePoiStoryContent>;

/** A place's cover image, title and Story. */
export const PlaceDetails = ({
  poi,
  story: { content, detail, isLoading },
  galleryKey,
  width,
  excludedByFilters,
  onOpenPerson,
}: {
  poi: Poi;
  story: StoryState;
  /** Set while the place is selected; a new key reopens the gallery at its first photo. */
  galleryKey?: string;
  width: number;
  excludedByFilters: boolean;
  onOpenPerson: (personId: string) => void;
}) => {
  const [failedMainImageUrl, setFailedMainImageUrl] = useState<string | null>(null);
  const [loadedWideImageUrl, setLoadedWideImageUrl] = useState<string | null>(null);
  const mainImage = detail?.gallery.find(({ id }) => id === detail.mainImageId);
  const mainImageUrl = detail ? mainImage?.thumbnailUrl : content ? poi.mainImageUrl : undefined;
  const isWideImage =
    mainImage?.width && mainImage.height ? mainImage.width >= mainImage.height : null;

  return (
    <>
      {mainImageUrl && mainImageUrl !== failedMainImageUrl ? (
        <figure>
          <div className="bg-surface-muted relative aspect-video w-full shrink-0 overflow-hidden">
            <Image
              src={mainImageUrl}
              alt={`Main image of ${detail?.name ?? poi.name}`}
              fill
              sizes={`(min-width: 768px) ${width}px, 100vw`}
              className={
                (isWideImage ?? mainImageUrl === loadedWideImageUrl)
                  ? "object-cover"
                  : "object-contain"
              }
              onLoad={({ currentTarget: { naturalWidth, naturalHeight } }) => {
                if (isWideImage === null && naturalWidth >= naturalHeight) {
                  setLoadedWideImageUrl(mainImageUrl);
                }
              }}
              onError={() => setFailedMainImageUrl(mainImageUrl)}
            />
            {galleryKey && detail && (
              <PoiImageGallery
                key={galleryKey}
                images={detail.gallery}
                mainImageId={detail.mainImageId}
                name={detail.name}
              />
            )}
          </div>
          {mainImage && (
            <figcaption className="text-ink-subtle px-5 py-2 text-xs/5">
              <ImageAttribution text={mainImage.attribution} /> ·{" "}
              <a
                href={mainImage.commonsPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                {mainImage.license} ↗
              </a>
            </figcaption>
          )}
        </figure>
      ) : detail ? (
        <div className="bg-surface-muted text-ink-subtle flex aspect-video items-center justify-center gap-2 text-sm">
          <PhotoIcon className="size-6" aria-hidden="true" />
          Image unavailable
        </div>
      ) : null}
      <Heading>{detail?.name ?? poi.name}</Heading>
      <div className="text-ink px-5 pt-2 pb-4 text-sm/6">
        {excludedByFilters && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
            This place is excluded by your active filters.
          </p>
        )}
        {!detail && poi.shortDescription ? <p>{poi.shortDescription}</p> : null}
        {isLoading ? null : content ? (
          <StoryContent
            content={content}
            period={detail ? undefined : poi.period}
            onOpenPerson={onOpenPerson}
          />
        ) : (
          <p className="text-ink-muted mt-4">This place is unavailable.</p>
        )}
      </div>
    </>
  );
};
