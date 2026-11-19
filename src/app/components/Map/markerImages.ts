import type { PositionAnchor } from "maplibre-gl";
import { categoryMarkerColors } from "@/app/components/categoryMarkerColors";

// MapLibre's default marker silhouette; its tip sits at y = 35.25.
const MARKER_PATH =
  "M27,13.5 C27,19.07 20.25,27 14.75,34.5 C14.02,35.5 12.98,35.5 12.25,34.5 C6.75,27 0,19.22 0,13.5 C0,6.04 6.04,0 13.5,0 C20.96,0 27,6.04 27,13.5 Z";
const PAD = 5;
const VIEW_WIDTH = 27 + PAD * 2;
const VIEW_HEIGHT = 35.25 + PAD * 2;
const MARKER_SCALE = 1.15;
export const SELECTED_MARKER_SCALE = 1.6;
/** Pixels from the image bottom up to the marker tip, so the tip marks the place. */
export const MARKER_TIP_OFFSET = PAD * MARKER_SCALE;
/** The drawn marker, in CSS pixels at icon-size 1, without its shadow margin. */
export const MARKER_WIDTH = 27 * MARKER_SCALE;
export const MARKER_HEIGHT = 35.25 * MARKER_SCALE;
const MARKER_GAP = 4;
const markerTop = -(MARKER_HEIGHT + MARKER_GAP);
const markerSide = MARKER_WIDTH / 2 + MARKER_GAP;
const markerMiddle = -(35.25 - 13.5) * MARKER_SCALE;
/** Popup offsets from the marker tip that keep a preview clear of its own marker. */
export const MARKER_POPUP_OFFSET: Record<PositionAnchor, [number, number]> = {
  center: [0, 0],
  top: [0, MARKER_GAP],
  "top-left": [0, MARKER_GAP],
  "top-right": [0, MARKER_GAP],
  bottom: [0, markerTop],
  "bottom-left": [0, markerTop],
  "bottom-right": [0, markerTop],
  left: [markerSide, markerMiddle],
  right: [-markerSide, markerMiddle],
};
// --color-brand is inlined by Tailwind, so it is not readable at runtime.
const BRAND_COLOR = "#ffda1a";

const markerImageId = (color: string, selected: boolean) =>
  `poi-marker-${color}${selected ? "-selected" : ""}`;

const markerSvg = (color: string, icon: string, selected: boolean, pixelRatio: number) => {
  const size = MARKER_SCALE * pixelRatio * (selected ? SELECTED_MARKER_SCALE : 1);
  const effect = selected
    ? `<feDropShadow dx="0" dy="0" stdDeviation="1.2" flood-color="${BRAND_COLOR}"/><feDropShadow dx="0" dy="1.6" stdDeviation="1.4" flood-opacity="0.45"/>`
    : `<feDropShadow dx="0" dy="1" stdDeviation="0.8" flood-opacity="0.3"/>`;
  const stroke = selected
    ? `stroke="#fff" stroke-width="3" stroke-linejoin="round" paint-order="stroke fill"`
    : `stroke="rgb(0 0 0 / 25%)" stroke-width="1"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${VIEW_WIDTH * size}" height="${VIEW_HEIGHT * size}" viewBox="${-PAD} ${-PAD} ${VIEW_WIDTH} ${VIEW_HEIGHT}"><filter id="f" x="-50%" y="-50%" width="200%" height="200%">${effect}</filter><g filter="url(#f)"><path d="${MARKER_PATH}" fill="${color}" ${stroke}/></g>${icon.replace("<svg ", '<svg x="5.5" y="5.5" width="16" height="16" ')}</svg>`;
};

const loadImage = async (svg: string) => {
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await image.decode();
  return image;
};

type MarkerImage = { id: string; image: HTMLImageElement; pixelRatio: number };
let markerImages: Promise<MarkerImage[]> | null = null;

/** Draws every category marker once, for the map's missing-image resolver on every style. */
export const loadMarkerImages = () =>
  (markerImages ??= Promise.all(
    categoryMarkerColors.map(async ({ icon, marker }) => {
      const svg = await (await fetch(icon)).text();
      const pixelRatio = Math.max(2, window.devicePixelRatio || 1);
      return Promise.all(
        [false, true].map(async (selected) => ({
          id: markerImageId(marker, selected),
          image: await loadImage(markerSvg(marker, svg, selected, pixelRatio)),
          // Selected markers are drawn larger so `icon-size` enlarges them without blur.
          pixelRatio: pixelRatio * (selected ? SELECTED_MARKER_SCALE : 1),
        })),
      );
    }),
  ).then(
    (images) => images.flat(),
    (error: unknown) => {
      markerImages = null; // Let the next missing image retry.
      throw error;
    },
  ));
