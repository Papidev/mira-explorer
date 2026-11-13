# Mira color palette

Mira has **two brand colors**, Mira Yellow and Atlas Blue, supported by **one neutral scale** and **two themes**, light and dark. The interface also assigns colors to **six content roles**, **four feedback states**, and **eight map categories**.

These counts describe design roles. Some roles share a color family. Tints, opacity variants, gradients, map tiles, and photography are outside the count.

## Brand and interaction

| Color | Value | Use |
| --- | --- | --- |
| Mira Yellow | `#FFDA1A` · `brand` | Logo accent, title strokes, and yellow action surfaces with dark text (`zinc-900`/`zinc-950` in both themes). `brand-soft` is a quieter surface such as Story period and Person life dates: `yellow-100` in light, `yellow-950` in dark. |
| Atlas Blue | `#345568` · `atlas`, plus `atlas-deep` (`#203E50`) and `atlas-glow` (`#426678`) for header gradients | City-map headers and the homepage “Explore Rome” action use white text and yellow accents on this surface. Homepage section labels and map links use Atlas Blue text. Blue headers stay blue in both themes. Use a yellow focus outline on the blue header. |

The [Tailwind theme](../../src/app/globals.css) defines the shared tokens. Atlas Blue has 7.9:1 contrast against white.

**Accent** (`accent`) is the interactive brand color on page surfaces: Atlas Blue in light, Mira Yellow in dark. Use it for checkmarks, selected borders, active tabs, keyboard focus on accent controls, section labels, spinners, and panel resize feedback.

## Themes and neutrals

The app follows the system setting. Visitors can override it with the System, Light, and Dark switch in the Rome header and the homepage footer; the choice is stored in the browser and set as `data-theme` on `<html>`. Use Tailwind's `dark:` variant for one-off dark values: it follows the same rule.

Components use role tokens instead of raw zinc or white, so both themes stay in sync:

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `canvas` | `zinc-50` | `zinc-950` | Page background and sidebars. |
| `surface` | white | `zinc-900` | Cards, drawers, menus, inputs. |
| `surface-muted` | `zinc-100` | `zinc-800` | Image placeholders, hovered menu items. |
| `ink` | `zinc-900` | `zinc-100` | Titles and body text. |
| `ink-muted` | `zinc-600` | `zinc-300` | Supporting text. |
| `ink-subtle` | `zinc-500` | `zinc-400` | Captions, counts, placeholders. |
| `line` / `line-strong` | `zinc-200` / `zinc-300` | white 10% / 20% | Dividers / input outlines and underlines. |
| `focus` | `zinc-800` | `zinc-200` | Neutral keyboard focus outlines. |

Keep fixed colors for content that does not change with the theme: white text on blue headers and photos, dark text on yellow, and dark overlays on images.

## Content colors

| Role | Color or token | Use |
| --- | --- | --- |
| Editorial emphasis | Amber · `story-emphasis` (`amber-700`, dark `amber-400`) | Selective bold in Stories, biographies, and homepage copy. |
| Person curiosities | Violet · `emphasis` (equal OKLCH mix of `violet-700` and `violet-800`, dark `violet-300`) | Curiosity bullets in the Person sheet. |
| Content links | Sky · `link` (`sky-800`, dark `sky-300`) with `link-line` underline | Markdown links and linked Person names. Keep the underline so links are recognizable without color. |
| History | Yellow · `yellow-800` (dark `yellow-300`) on `brand-soft/40` | History heading, scroll icon, dates, and timeline markers. |
| Architecture | Atlas Blue · `atlas` (dark `sky-300`) on `sky-100/60` | Architecture heading, icon, and bullets. |
| Art | Rose · `rose-800` (dark `rose-300`) on `rose-50/60` | Art heading, icon, and bullets. |

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

Markers keep their colors in both themes; the Rome map switches between the OpenFreeMap Liberty and Dark basemaps. The marker and its filter pin share a category color and icon. A selected marker keeps its category hue and gains a larger silhouette and outline. See the [category rules](../poi-categories.md) and the [marker color definitions](../../src/app/components/categoryMarkerColors.ts).
