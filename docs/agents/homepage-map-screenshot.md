# Homepage map screenshot

Read this procedure before replacing the homepage map screenshot. Use the committed image referenced by `MapShowcase` as the visual baseline; it records the approved framing more precisely than a sequence of mouse drags.

## Setup

1. Use the requested visitor URL. If it is already open in Chrome, use that tab. Otherwise, open it in Chrome.
2. Undock Chrome DevTools and set the device toolbar to **1728 × 798 CSS pixels** with **device pixel ratio 2** before moving the map. The native PNG should be **3456 × 1596 pixels**.
3. Use the visible map and panels to compose the shot. If you need a locator, query the individual control or marker by name. Skip full-page DOM and accessibility snapshots, which list the entire catalog.

## Composition

- Use the running visitor app with its actual published POIs and all categories enabled.
- Keep the filters visible on the left, scrolled to the category controls, and Castel Sant’Angelo’s detail drawer open on the right, scrolled to its main image and introduction.
- Keep **Ara Pacis** in preview while Castel Sant’Angelo remains selected. The preview must be fully visible, including its image, title, description, and yellow arrow.
- Start at map zoom **14.15**, with the center shifted south toward the historic center. Match the reference image’s framing and marker distribution. The intended result is visibly rich, with markers across the map and more places toward the south, while streets and separate markers remain readable. Catalog changes may require a small framing adjustment.

## Capture

1. Wait until map tiles, fonts, Story image, and preview image have finished rendering. Compare the composition to the reference before exporting.
2. Place the pointer over a neutral area outside markers and controls. For a stable preview, focus the Ara Pacis marker using the browser's supported keyboard interaction. If it is already focused but another hover has replaced its preview, focus a harmless control first and then return to Ara Pacis. Verify the visible preview name immediately before capture.
3. In the undocked DevTools Command Menu, run **Capture screenshot** to export the native PNG.
4. Inspect the saved PNG before closing DevTools. Confirm **3456 × 1596 pixels**, zoom **14.15**, all categories enabled, the full Ara Pacis preview, Castel Sant’Angelo’s image and introduction, and the pointer clear of controls and markers. Preserve the interface content and attribution. If anything is missing, adjust the open view and capture again before compressing.

## Compress and integrate

Encode the original PNG directly to WebP with **quality 80**, **effort 6**, and **smartSubsample true**, retaining its pixel dimensions. Use the existing Sharp dependency resolved through Next; no package installation is needed. For example, from the repository root:

```bash
node <<'NODE'
const { createRequire } = require('node:module');
const sharp = createRequire(require.resolve('next/package.json'))('sharp');

sharp('/tmp/mira-map-retina.png')
  .webp({ quality: 80, effort: 6, smartSubsample: true })
  .toFile('/tmp/mira-map-retina.webp')
  .then(({ width, height, size }) => console.log({ width, height, bytes: size }));
NODE
```

The approved image went from **2,065,138 bytes** as lossless WebP to **634,076 bytes** at quality 80, with the same 3456 × 1596 resolution. Aim for roughly **600–800 KB**, rather than treating that exact byte count as a requirement. Compare enlarged crops containing text, colored markers, and map labels against the original PNG before accepting the result. Re-encode from the original capture when tuning quality, rather than repeatedly compressing a compressed file.

In `MapShowcase`, set the intrinsic dimensions to the actual exported dimensions and keep `unoptimized` for this already compressed screenshot, preserving its chosen quality without another image-optimizer pass. Use a new descriptive asset filename when replacing an already served image, so cached screenshots do not conceal the update. Remove superseded screenshot assets only after checking their references.

## Completion

- Verify the saved asset's dimensions and byte size.
- Inspect it in the running homepage at its actual display size, confirming the current asset loaded and both Ara Pacis and Castel Sant’Angelo remain visible.
- Check the changed JSX with targeted ESLint and inspect the diff; an asset replacement and intrinsic dimensions alone do not require application tests or a build.
- Show the resulting image to the user. Report resolution and size without claiming lossless quality for the quality-80 WebP.
