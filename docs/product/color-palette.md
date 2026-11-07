# Mira color palette

Mira has **two brand colors**, Mira Yellow and Atlas Blue, supported by **one neutral scale**. The interface also assigns colors to **six content roles**, **four feedback states**, and **eight map categories**.

These counts describe design roles. Some roles share a color family. Tints, opacity variants, gradients, map tiles, and photography are outside the count.

## Brand and interaction

| Color | Value | Use |
| --- | --- | --- |
| Mira Yellow | `#FFDA1A` · `brand`, `brand-action` | Logo accent, title strokes, and primary actions with dark text. `brand-soft` uses Tailwind `yellow-100` for quieter surfaces such as Story period and Person life dates. |
| Atlas Blue | `#345568` · `atlas` | City-map headers with white text and yellow accents. On light surfaces, use it for checkmarks, selected borders, active tabs, keyboard focus, and panel resize feedback. Use a yellow focus outline on the blue header. |

The [Tailwind theme](../../src/app/globals.css) defines the shared tokens. Atlas Blue has 7.9:1 contrast against white.

## Neutrals

Use the white-to-zinc scale for the canvas, cards, text, borders, and supporting labels. White and light zinc provide surfaces. Dark zinc carries titles and body text. Mid zinc is for supporting text, dividers, and inactive controls. The theme's page defaults are `#FFFFFF` and `#171717` in light mode, and `#0A0A0A` and `#EDEDED` in dark mode.

## Content colors

| Role | Color or token | Use |
| --- | --- | --- |
| Editorial emphasis | Amber · `story-emphasis` (`amber-700`) | Selective bold in Stories, biographies, and homepage copy. |
| Person curiosities | Violet · `emphasis` (equal OKLCH mix of `violet-700` and `violet-800`) | Curiosity bullets in the Person sheet. |
| Content links | Sky · `sky-800` with `sky-300` underline | Markdown links and linked Person names. Keep the underline so links are recognizable without color. |
| History | Yellow · `yellow-800` on `brand-soft/40` | History heading, scroll icon, dates, and timeline markers. |
| Architecture | Atlas Blue · `atlas` on `sky-100/60` | Architecture heading, icon, and bullets. |
| Art | Rose · `rose-800` on `rose-50/60` | Art heading, icon, and bullets. |

## Feedback colors

| State | Color family | Examples |
| --- | --- | --- |
| Information | Sky | Work-in-progress notice and informational panels. |
| Success | Green / emerald | Successful admin actions and completed generation. |
| Warning | Amber | Filter exclusions, work in progress, and partial outcomes. |
| Error or destructive action | Red | Failed operations, error messages, and destructive controls. |

Use text or an icon alongside the color to identify the state.

## Map categories

| Category | Color | Marker value |
| --- | --- | --- |
| Religion | Yellow | `#FACC15` |
| Arts & Culture | Emerald | `#10B981` |
| Architecture | Orange | `#EA580C` |
| Memorials | Violet | `#8B5CF6` |
| Public Spaces | Rose | `#E11D48` |
| Sports | Blue | `#2563EB` |
| Nature | Lime | `#65A30D` |
| Other places | Cyan | `#3FB1CE` |

The marker and its filter pin share a category color and icon. A selected marker keeps its category hue and gains a larger silhouette and outline. See the [category rules](../poi-categories.md) and the [marker color definitions](../../src/app/components/categoryMarkerColors.ts).
