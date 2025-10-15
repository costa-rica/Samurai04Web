# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript Next.js dashboard application using App Router, Tailwind CSS, and Redux Toolkit for state management. The project is based on architecture from TailAdmin and customized for a NewsNexus Portal use case.

**Important**: Do not use Turbopack (via --turbo flag) as it causes problems with SVG icons in src/icons.

## Common Commands

### Development

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Architecture

### App Router Structure

The application uses Next.js 15 App Router with route groups for layout organization:

- `src/app/(dashboard)/` - Dashboard pages with sidebar and header layout

  - Example: `src/app/(dashboard)/home/page.tsx`
  - Uses `src/app/(dashboard)/layout.tsx` for shared dashboard UI

- `src/app/(full-width)/(auth)/` - Full-width pages (login, register) without dashboard chrome
  - Example: `src/app/(full-width)/(auth)/login/page.tsx`
  - Uses `src/app/(full-width)/(auth)/layout.tsx` for auth-specific layout

Route groups (parentheses) don't affect URL structure - they only organize layouts.

### State Management

Redux Toolkit with persistence:

- Store configuration: `src/store/index.ts`
- Feature slices: `src/store/features/` (e.g., `src/store/features/user/userSlice.ts`)
- Typed hooks: `src/store/hooks.ts` exports `useAppDispatch` and `useAppSelector`
- Redux persist is configured to persist the `user` slice to localStorage

### Provider Hierarchy

Provider wrapping order in `src/app/layout.tsx`:

1. Redux `<Providers>` (wraps redux-persist's PersistGate) - `src/app/providers.tsx`
2. `<ThemeProvider>` - Dark/light mode context from `src/context/ThemeContext.tsx`
3. `<SidebarProvider>` - Sidebar state (expanded/collapsed, mobile open/closed) from `src/context/SidebarContext.tsx`

### Layout Components

Dashboard layout structure (`src/layout/`):

- `AppHeader.tsx` - Top navigation bar
- `AppSidebar.tsx` - Left sidebar navigation
- `Backdrop.tsx` - Mobile overlay when sidebar is open
- `SidebarWidget.tsx` - Reusable sidebar content components

The dashboard layout uses responsive margins that adjust based on sidebar state:

- Desktop: `lg:mr-[290px]` when expanded, `lg:mr-[90px]` when collapsed
- Mobile: Sidebar slides over content with backdrop

### Component Organization

- `src/components/ui/` - Reusable UI primitives (button, modal, dropdown, alert, badge, avatar, table, images, video)
- `src/components/tables/` - Specialized table components for different data views
- `src/components/form/` - Form elements (inputs, checkboxes, radio, textarea, file input, date picker, dropzone, labels)
- `src/icons/` - SVG icon components (64 total)

### Styling

- Tailwind CSS 4.x with PostCSS
- Custom theme configuration supports dark mode via `dark:` prefix
- Global styles: `src/app/globals.css`
- Font: Outfit (Google Font) loaded in root layout

### TypeScript Configuration

Path alias configured: `@/*` maps to `./src/*`

Example import: `import Button from "@/components/ui/button/Button"`

## Development Notes

### Adding New Dashboard Pages

1. Create page in `src/app/(dashboard)/your-route/page.tsx`
2. Page automatically inherits dashboard layout (header + sidebar)
3. Add route to sidebar navigation in `src/layout/AppSidebar.tsx`

### Adding Redux State

1. Create feature slice in `src/store/features/your-feature/yourFeatureSlice.ts`
2. Add reducer to `rootReducer` in `src/store/index.ts`
3. Add to `whitelist` array if state should persist to localStorage
4. Use typed hooks from `src/store/hooks.ts` in components

### Context Usage

- Theme: `useTheme()` from `@/context/ThemeContext`
- Sidebar: `useSidebar()` from `@/context/SidebarContext`

Both contexts are client-side only (`"use client"` required).
