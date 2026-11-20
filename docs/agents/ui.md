# Building UI

## Sources

- Before creating or changing a city logo, read [City logos](../city-logos.md) and follow the approved Rome drawing style and surface colors.
- First check `src/app/components/ui/` for a matching app-owned component.
- If none fits, inspect Tailwind Plus UI Blocks through the authenticated Chrome session and evaluate the available React variants before designing the component.
- Check the local Catalyst reference after UI Blocks when lower-level primitives are needed, then implement only the app-owned adaptation in `src/app/components/ui/` or the relevant feature.

## Licensing

- `.tailwind-plus/` holds paid Tailwind Plus source when present locally and is intentionally gitignored. Use it only as a reference catalog: production code never imports it, and it stays on licensed development machines.
- The repo may commit Catalyst runtime dependencies, Tailwind theme/font setup, and app-specific components built from or inspired by Catalyst or Tailwind Plus examples.

## Styling

- Add `cursor-pointer` to enabled custom interactive controls and their clickable labels when the browser does not provide it; use `cursor-not-allowed` for disabled controls.
- Prefer Tailwind utilities directly in owned JSX, and keep small class-list repetitions local. When a repeated pattern represents reusable structure or behavior, extract a React component that owns the utilities. Reserve custom CSS and `@apply` for cases where a component would be disproportionate or the markup is externally generated. Use class-list maps only for real component variants, not solely to deduplicate strings.
- Keep `globals.css` limited to genuinely shared styles: feature-specific styles belong in the owned component or its integration adapter, including narrowly scoped DOM styles at third-party boundaries. Use global CSS for generated or third-party markup only when no local styling hook exists, and place component rules in `@layer components`.
- In custom CSS, use Tailwind theme variables for colors, spacing, typography, radii, shadows, and other design tokens; use literal values only for deliberate exceptions not covered by the theme.
