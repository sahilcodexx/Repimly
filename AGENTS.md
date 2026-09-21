# Repimly — AI-Powered Image Editor

## Overview
A web-based image editor built with Next.js, Convex (backend), Clerk (auth), and Fabric.js (canvas). Users upload images, edit them with AI-powered tools (background removal, AI extender, AI edit) and manual tools (crop, resize, adjust, text, shapes, layers), then export.

## Tech Stack
- **Framework:** Next.js 16 (Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (CSS-based config in `app/globals.css`)
- **UI Library:** shadcn/ui (custom components in `components/ui/`)
- **Backend/Database:** Convex (realtime, schema in `convex/schema.ts`)
- **Auth:** Clerk (`@clerk/nextjs`) + Convex JWT auth (`convex/auth.config.ts`)
- **Canvas:** Fabric.js v7 (`fabric`)
- **Animations:** framer-motion, motion
- **Image Hosting:** ImageKit (`imagekit`)
- **Icons:** lucide-react
- **Font:** Geist (via `next/font/google`)
- **Theme:** next-themes (light/dark mode)
- **Linting:** ESLint
- **Formatting:** Prettier + `prettier-plugin-tailwindcss`

## Project Structure
```
app/
  (auth)/              # Sign-in, sign-up pages
  (main)/
    dashboard/         # Project listing, create project
    editor/            # Editor page
      [projectid]/
        page.tsx       # Main editor page with CanvasContext provider
      _components/
        canvas-editor.tsx       # Fabric.js canvas wrapper
        canvas-context-menu.tsx # Right-click context menu
        editor-sidebar.tsx      # Left sidebar with tool panels
        editor-topbar.tsx       # Top toolbar with tools, undo/redo, save, export
        grid-overlay.tsx        # Grid snap hook + utility
        zoom-controls.tsx       # Zoom slider + fit-to-screen
        use-keyboard-shortcuts.ts  # ⌘Z, ⌘S, Delete, etc.
        tools/
          Adjust.tsx             # Brightness, contrast, filters
          Crop.tsx               # Crop controls
          Resize.tsx             # Resize dimensions
          background-controls.tsx # AI background removal/replace
          text-control.tsx       # Add/edit text
          shape-controls.tsx     # Rectangle, circle, line, arrow, etc.
          layer-panel.tsx        # Layer visibility, lock, reorder
          ai-extender-controls.tsx # AI image extender
          ai-edit.tsx            # AI image enhancement
components/
  ui/                  # shadcn components (button, card, dialog, etc.)
  common/              # header, footer, upgrade-modal, etc.
  theme-toggle.tsx     # Light/dark mode toggle
context/
  context.tsx          # CanvasContext — shared canvas state
convex/
  schema.ts            # Database schema (users, project, folder)
  auth.config.ts       # Clerk JWT auth config
  users.ts             # User queries/mutations
  project.ts           # Project CRUD queries/mutations
hooks/
  use-convex-query.tsx # Wrappers around Convex useQuery/useMutation
  use-plan-access.ts   # Plan gating (free vs pro)
```

## Key Conventions

### Code Style
- No comments in code unless necessary
- Use existing patterns (look at neighboring files before writing new code)
- Use shadcn components where possible (import from `@/components/ui/`)
- Theme tokens: `bg-background`, `text-foreground`, `border-border`, `bg-muted`, `text-muted-foreground`, `bg-card`, `bg-primary`, `text-primary`, `bg-destructive`, `text-destructive`
- Border radius uses shadcn scale: `rounded-sm` (6px), `rounded-md` (8px), `rounded-lg` (10px), `rounded-xl` (14px)

### CanvasContext (`context/context.tsx`)
Provides: `canvasEditor`, `setCanvasEditor`, `activeTool`, `onToolChange`, `history`, `historyIndex`, `canUndo`, `canRedo`, `undo`, `redo`, `reset`, `saveState`, `isSaving`, `showGrid`, `setShowGrid`, `processingMessage`, `setProcessingMessage`

### Tools System
- Tools are defined in `editor-topbar.tsx` with `id`, `label`, `icon`, `proOnly?`
- Each tool's panel renders in `editor-sidebar.tsx` via `renderToolConfig()`
- Types: `ToolId` in `utils/types.ts` — `resize | crop | adjust | text | background | ai_extender | ai_edit | layers | shapes`
- All tools are free except: `background`, `ai_extender`, `ai_edit` (Pro only)
- Layers and Shapes were recently added as free tools

### Plan System (`hooks/use-plan-access.ts`)
- `hasAccess(toolId)` — checks if tool is available
- `canCreateProject(count)` — free users limited to 3 projects
- `canExport(count)` — free users limited to 20 exports/month

### Auto-save
- History-based undo/redo system in `page.tsx`
- `saveState()` snapshots canvas JSON into history array
- Debounced auto-save (2s) writes to Convex via `updateProject`
- `lastSavedRef` skips saves when state hasn't changed

### Fabric.js Canvas
- Canvas initialized in `canvas-editor.tsx` using `new Canvas()`
- Custom selection nubs: circle style, primary color, size 8
- Objects snap to 20px grid when grid is enabled
- `useGridSnap()` hook for snap-to-grid logic

## Environment Variables
Keys are in `.env` and `.env.local`. See those files for current values.
- `NEXT_PUBLIC_CONVEX_URL` — Convex deployment URL
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` — Clerk auth
- `CLERK_JWT_ISSUER_DOMAIN` — Clerk JWT issuer for Convex
- `NEXT_PUBLIC_CONVEX_SITE_URL` — Convex site URL
- `NEXT_PUBLIC_IMAGE_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY` — ImageKit
- `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` — ImageKit URL endpoint
- `CONVEX_DEPLOY_KEY` — Convex deploy key
- `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY` — Unsplash API key

## Running Locally
```bash
npm run dev       # Next.js dev server (Turbopack)
npx convex dev    # Convex dev server (runs functions locally)
```
No typecheck script exists. Use `npx tsc --noEmit` to typecheck.

## Important Notes
- No testing framework installed
- reactStrictMode is disabled
- `framer-motion` and `motion` packages are both installed (prefer `motion` for new code)
- Convex deployment: `loyal-lyrebird-253` (eu-west-1)
- ImageKit is used for image uploads/hosting
