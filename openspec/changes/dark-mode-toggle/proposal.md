## Why

Users work in varied lighting environments — trade shows, offices, home — and the current white-heavy UI causes eye strain in low-light conditions. Adding dark mode improves comfort and brings the app in line with standard OS-level expectations.

## What Changes

- Add a theme preference (light / dark / system) stored in the user's browser
- Surface a mode selector on the Profile page, accessible from the avatar dropdown
- Apply the selected theme across the entire dashboard via Tailwind's `dark:` variant classes

## Capabilities

### New Capabilities
- `theme-preference`: User-controlled light/dark/system theme selection, persisted in localStorage and applied via a `dark` class on the root `<html>` element using `next-themes`

### Modified Capabilities
- `user-profile`: Profile page gains a Theme section alongside the existing API Keys section

## Impact

- **Dependencies**: Add `next-themes` package
- **Layout**: Root layout must wrap children in `ThemeProvider`
- **Tailwind config**: Enable `darkMode: 'class'` strategy
- **Components**: Profile page (`app/(dashboard)/profile/page.tsx`) and any components that need explicit `dark:` overrides
- **No breaking changes**
