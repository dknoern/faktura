## Context

The app already has the dark mode infrastructure in place: Tailwind is configured with `darkMode: ["class"]` and `globals.css` defines a `.dark { }` block with all CSS variable overrides. What's missing is the mechanism to toggle the `dark` class on `<html>` and persist the user's choice.

## Goals / Non-Goals

**Goals:**
- Wire `next-themes` into the root layout as a `ThemeProvider` so the `dark` class is applied automatically
- Expose a Light / Dark / System selector on the Profile page
- Persist the preference in `localStorage` (handled by `next-themes`)

**Non-Goals:**
- Per-tenant or server-side theme storage — localStorage is sufficient for a preference this lightweight
- Theming the print/PDF views — those are separate rendered documents
- Auditing or retrofitting any components that don't respond correctly to `dark:` classes — the shadcn/ui component set already uses CSS variables that flip correctly

## Decisions

**Use `next-themes`** — it handles the `dark` class on `<html>`, avoids flash-of-wrong-theme (FOUC) via a blocking script injected before paint, supports a `system` option that follows `prefers-color-scheme`, and is the standard choice for Next.js + Tailwind dark mode.

Alternative considered: manual `localStorage` + `useEffect` — rejected because it causes FOUC on initial load and requires reimplementing what `next-themes` already solves.

**Three-option selector (Light / Dark / System)** — matches OS-level conventions users expect. A binary toggle was considered but rejected because it doesn't respect "follow system" preference.

**Profile page placement** — consistent with where API key management lives; accessible from the avatar dropdown without disrupting the main nav.

## Risks / Trade-offs

- **FOUC on SSR**: `next-themes` adds a small inline script to `<head>` that resolves the theme before React hydrates. Must use `suppressHydrationWarning` on `<html>` to silence the expected attribute mismatch. [Risk: forgotten attribute causes hydration warnings] → Add `suppressHydrationWarning` to `<html>` in root layout.

- **Print views**: The `dark` class on `<html>` will be inherited by print routes if opened in the same session. PDF generation is server-side and unaffected, but browser print-preview could be dark. [Mitigation: out of scope; can add `@media print { ... }` CSS overrides later if needed.]

## Migration Plan

1. `npm install next-themes`
2. Wrap root layout children in `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>`
3. Add `suppressHydrationWarning` to `<html lang="en">`
4. Add `ThemeToggle` component to Profile page
5. No rollback complexity — removing the provider reverts to always-light
