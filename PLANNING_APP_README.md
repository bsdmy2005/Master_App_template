# Black Glass Planning & Estimation App

This is a Next.js application for managing and estimating Black Glass use cases across all clients.

## Structure

```
PROJECT_PLAN/
├── app/
│   └── planning/
│       ├── _components/
│       │   ├── client-card.tsx          # Client card with use cases
│       │   ├── use-case-table.tsx        # Table displaying use cases
│       │   ├── use-case-form.tsx         # Form for adding/editing use cases
│       │   ├── estimation-calculator.tsx # Calculator for effort estimation
│       │   └── summary-dashboard.tsx    # Summary statistics dashboard
│       ├── page.tsx                      # Main planning page
│       └── layout.tsx                    # Layout wrapper
├── lib/
│   ├── hooks/
│   │   └── use-local-storage.ts         # Hook for local storage persistence
│   └── seed-data.ts                      # Initial seed data from BG_PLAN_SUMMARY.md
└── types/
    └── planning-types.ts                 # TypeScript type definitions
```

## Features

1. **Dashboard View**
   - Total man-days and story points across all clients
   - Breakdown by complexity and status
   - Summary by client

2. **CRUD Operations**
   - Add new use cases
   - Edit existing use cases
   - Delete use cases
   - All data persisted in browser local storage

3. **Estimation Calculator**
   - Input story points and complexity
   - Auto-calculates man-days based on guidelines:
     - High Complexity (21 SP): 37.5 man-days
     - High Complexity (13 SP): 27.5 man-days
     - Medium Complexity (8 SP): 17.5 man-days
   - Customizable multipliers

## Integration into Next.js Project

To integrate this into your existing Next.js project:

1. Copy the `app/planning` directory to your Next.js app directory
2. Copy the `lib` and `types` directories to your project root
3. Ensure you have the following dependencies in `package.json`:
   ```json
   {
     "react": "^18.0.0",
     "react-dom": "^18.0.0",
     "next": "^14.0.0"
   }
   ```
4. Ensure your `tsconfig.json` has path aliases configured:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./*"]
       }
     }
   }
   ```
5. Add Tailwind CSS configuration if not already present
6. Navigate to `/planning` in your app to access the planning interface

## Data Model

The app uses the following data structure:

- **Client**: Contains client information (name, overview, systems)
- **UseCase**: Contains use case details (title, description, story points, complexity, man-days, etc.)
- **PlanningData**: Container for all clients and use cases

Data is persisted in browser local storage under the key `black-glass-planning-data`.

## Effort Estimation Guidelines

- **High Complexity (21 SP):** 35-40 man-days (default: 37.5)
- **High Complexity (13 SP):** 25-30 man-days (default: 27.5)
- **Medium Complexity (8 SP):** 15-20 man-days (default: 17.5)
- **Low Complexity:** 10 man-days (default)
- **Consolidated/Out of Scope:** 0 man-days

## Current Totals (from BG_PLAN_SUMMARY.md)

- **Standard Bank Group:** 137.5 man-days
- **Navigate (NAV):** 247.5 man-days
- **Momentum Group:** 147.5 man-days
- **Sanlam Financial Markets:** 120.0 man-days
- **GRAND TOTAL:** 652.5 man-days

