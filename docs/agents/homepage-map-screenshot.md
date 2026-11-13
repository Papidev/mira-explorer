# Homepage map screenshot

Use the committed image referenced by `MapShowcase` as the visual baseline; it records the approved framing.

## Composition

- The running visitor app with its actual published POIs and all categories enabled, in the light theme.
- Filters visible on the left, scrolled to the category controls; Castel Sant’Angelo’s detail drawer open on the right, showing its main image and introduction.
- **Ara Pacis** in preview while Castel Sant’Angelo remains selected. The preview is fully visible: image, title, description, and yellow arrow.
- Map zoom **14.15**, centered south of Castel Sant’Angelo toward the historic center: visibly rich, with markers across the map and more places toward the south, while streets and separate markers remain readable.
- 1728 × 798 CSS pixels at device pixel ratio 2, giving a **3456 × 1596** PNG.

## Capture

[`capture-homepage-screenshot.mjs`](capture-homepage-screenshot.mjs) produces this composition in headless Chrome and encodes the WebP. Start the dev server (or use the requested visitor URL), then run from the repository root:

```bash
node docs/agents/capture-homepage-screenshot.mjs http://localhost:3000 /tmp/mira-map-retina
```

It writes `<out>.png` and `<out>.webp` and prints zoom, unchecked categories, drawer state, dimensions, and WebP bytes. On the dev server it removes the Next.js dev badge before capture. When the catalog shifts the framing, adjust `VIEW.center` in the script and commit the new value with the screenshot.

Open the PNG and confirm the composition above before integrating: the full Ara Pacis preview, Castel Sant’Angelo’s image and introduction, no hovered marker, and the map attribution.

## Compression

The script encodes WebP at **quality 80**, **effort 6**, **smartSubsample true**, at full resolution, using the Sharp dependency resolved through Next. Expect roughly **600–800 KB**. Compare enlarged crops of text, colored markers, and map labels against the PNG. To tune quality, re-encode from the PNG rather than the WebP.

## Integrate

In `MapShowcase`, set the intrinsic dimensions to the exported dimensions and keep `unoptimized`, so the chosen quality is served without another optimizer pass. Give the asset a new descriptive filename so cached screenshots do not conceal the update, and remove the superseded asset after checking its references.

## Completion

- Inspect the image in the running homepage at its actual display size, confirming the current asset loaded and both Ara Pacis and Castel Sant’Angelo remain visible.
- Check the changed JSX with targeted ESLint and inspect the diff; an asset replacement and intrinsic dimensions alone do not require application tests or a build.
- Show the resulting image to the user. Report resolution and size without claiming lossless quality for the quality-80 WebP.
