"use client";

import { useState } from "react";
import Image, { getImageProps } from "next/image";
import { ArrowLongRightIcon, PhotoIcon } from "@heroicons/react/24/outline";
import type { Poi } from "@/types/Poi";

const IMAGE_SIZES = "288px";
const preloadedImageUrls = new Set<string>();

/** Fetches the exact optimized image the card will request, so hovering shows it from cache. */
export const preloadPreviewImage = ({ mainImageUrl }: Poi) => {
  if (!mainImageUrl || preloadedImageUrls.has(mainImageUrl)) return;
  preloadedImageUrls.add(mainImageUrl);
  const { srcSet, sizes, src } = getImageProps({
    src: mainImageUrl,
    alt: "",
    fill: true,
    sizes: IMAGE_SIZES,
  }).props;
  const image = document.createElement("img");
  image.fetchPriority = "low";
  if (sizes) image.sizes = sizes;
  if (srcSet) image.srcset = srcSet;
  image.src = src;
};

type Props = {
  poi: Poi;
  onOpenDetails: () => void;
};

export const PoiPreviewCard = ({ poi, onOpenDetails }: Props) => {
  const [hasImageError, setHasImageError] = useState(false);
  const description = poi.previewDescription ?? poi.shortDescription;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onOpenDetails();
      }}
      className="group focus-visible:ring-accent bg-surface block w-72 max-w-full cursor-pointer overflow-hidden rounded-xl text-left shadow-lg ring-1 ring-black/5 focus:outline-none focus-visible:ring-2"
    >
      <div className="bg-surface-muted relative aspect-2/1 w-full">
        {poi.mainImageUrl && !hasImageError ? (
          <Image
            src={poi.mainImageUrl}
            alt={`Main image of ${poi.name}`}
            fill
            sizes={IMAGE_SIZES}
            loading="eager"
            className="object-cover"
            onError={() => setHasImageError(true)}
          />
        ) : (
          <div className="text-ink-subtle flex size-full flex-col items-center justify-center gap-2">
            <PhotoIcon className="size-8" aria-hidden="true" />
            <span className="text-xs font-medium">Image unavailable</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 ring-1 ring-black/10 ring-inset" />
        <span
          aria-hidden="true"
          className="bg-brand absolute right-3 bottom-3 flex size-8 items-center justify-center rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-md text-zinc-900 shadow-sm transition-colors"
        >
          <ArrowLongRightIcon className="size-6 -rotate-45" strokeWidth={1.5} />
        </span>
      </div>
      <div className="p-4">
        <h3 className="text-ink font-serif text-xl/6 tracking-tight">{poi.name}</h3>
        {description ? (
          <p className="text-ink-muted mt-1 line-clamp-3 text-sm/6">{description}</p>
        ) : null}
      </div>
    </button>
  );
};
