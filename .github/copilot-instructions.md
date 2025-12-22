# Slicing Pie - Copilot Instructions

## Project Overview
- **Stack**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4.
- **Backend**: PocketBase (local instance at `http://127.0.0.1:8090`).
- **State/Auth**: Client-side auth via `AuthProvider` context (`components/AuthProvider.tsx`).
- **Purpose**: Equity split calculator based on the "Slicing Pie" model.

## Architecture & Patterns

### Data Fetching & Backend
- **PocketBase SDK**: Use the singleton instance from `@/lib/pocketbase`.
- **Client-Side Fetching**: Most data fetching happens in `useEffect` hooks within client components (`"use client"`).
  - Example: `pb.collection("users").getFullList()` in `app/page.tsx`.
- **Types**: Define interfaces extending `RecordModel` from `pocketbase`.
  ```typescript
  import { RecordModel } from "pocketbase";
  interface Contribution extends RecordModel {
    user: string;
    amount: number;
    // ...
  }
  ```
- **Auth**: Access user state via `useAuth()` hook.
  ```typescript
  const { user, logout } = useAuth();
  if (user?.role === "admin") { ... }
  ```

### Component Structure
- **App Router**: Pages in `app/`.
- **Components**: Reusable UI in `components/`.
- **Avatars**: Custom avatar system in `components/avataaars-lib/`.
- **Charts**: Uses `recharts` for data visualization (`PieChart.tsx`, `VelocityChart.tsx`).

### Styling
- **Tailwind CSS v4**: Use utility classes.
- **Theming**: CSS variables defined in `app/globals.css` (e.g., `bg-background`, `text-foreground`).
- **Icons**: No specific icon library seen; prefer standard SVG or simple implementations.

## Development Workflow
- **Dev Server**: `pnpm dev` (runs Next.js).
- **PocketBase**: Must be running locally: `./pocketbase/pocketbase serve`.
- **Linting**: `pnpm lint`.

## Business Logic (Slicing Pie)
- **Multipliers**:
  - Time: 2x multiplier (FMV * 2).
  - Money: 4x multiplier (FMV * 4).
- **Calculations**: Logic often resides in components (e.g., `ContributionForm.tsx`) before sending to DB.
- **Roles**: Check `user.role` for "admin" privileges.

## Common Tasks
- **Adding a new contribution type**: Update `ContributionForm.tsx` and ensure backend schema supports it.
- **Modifying Charts**: Update `recharts` components in `components/`.
- **Auth Protection**: `AuthProvider` handles basic route protection; check `user` in components for granular access.
