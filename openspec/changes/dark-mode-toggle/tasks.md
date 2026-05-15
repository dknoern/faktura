## 1. Dependencies

- [x] 1.1 Install `next-themes` package

## 2. Root Layout Wiring

- [x] 2.1 Add `suppressHydrationWarning` to `<html>` element in `app/layout.tsx`
- [x] 2.2 Import and wrap layout children in `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>` from `next-themes`

## 3. Theme Selector Component

- [x] 3.1 Create `components/theme-toggle.tsx` — a client component with Light / Dark / System buttons using `useTheme` from `next-themes`
- [x] 3.2 Visually indicate the active selection (e.g. filled/outlined button variant)

## 4. Profile Page Integration

- [x] 4.1 Add a Theme section to `app/(dashboard)/profile/page.tsx` that renders `<ThemeToggle>`
- [x] 4.2 Verify the section appears between user info and the API keys section

## 5. Verification

- [ ] 5.1 Confirm selecting Dark applies the `dark` class to `<html>` immediately
- [ ] 5.2 Confirm selecting System follows OS preference and updates dynamically
- [ ] 5.3 Confirm preference survives a page reload
- [ ] 5.4 Confirm no flash-of-wrong-theme on initial load
