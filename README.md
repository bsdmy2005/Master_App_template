# Black Glass Use Case Manager

A modern, responsive use case management dashboard for managing Black Glass use cases across multiple clients.

## Features

- **Client Management**: Add, edit, and manage clients
- **Use Case Management**: Track use cases with complexity, gap, and effort estimation
- **Developer Repository**: Manage developers and their capacity
- **Timeline View**: Visualize use cases over time
- **Gantt Chart**: Interactive Gantt chart visualization
- **Developer Planning**: Plan projects based on developer capacity with conflict detection
- **Multiple Views**: Client, Use Case, Priority, and Start Date views
- **Password Protection**: Simple password-based authentication

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local` file in the root directory:
   ```
   DASHBOARD_PASSWORD=your-secure-password-here
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Access Dashboard**
   Navigate to `http://localhost:3000` - you'll be redirected to the dashboard and prompted for the password.

## Data Storage

All data is stored in `data/planning-data.json` as JSON files. The application will automatically seed initial data from `BG_PLAN_SUMMARY.md` on first run.

## Project Structure

```
app/
  dashboard/
    _components/     # Dashboard components
    layout.tsx       # Dashboard layout with password protection
    page.tsx         # Main dashboard page
lib/
  storage.ts         # File-based storage utilities
  seed-data.ts       # Data seeding from markdown
  effort-formula.ts  # Effort estimation formulas
types/
  planning-types.ts  # TypeScript type definitions
data/
  planning-data.json # Main data file (auto-created)
```

## Key Features

### Effort Estimation
Man-days are calculated using the formula: `manDays = base + (gap * multiplier)`
- Low Complexity: `10 + (gap * 1.5)`
- Medium Complexity: `17.5 + (gap * 2.0)`
- High Complexity: `27.5 + (gap * 2.5)`

### Capacity Conflict Detection
The developer planning view automatically detects when developers are assigned to multiple use cases with overlapping time periods and highlights conflicts.

### View Modes
- **Client View**: Grouped by client with expandable sections
- **Use Case View**: Flat list sorted alphabetically
- **Priority View**: Sorted by priority
- **Start Date View**: Sorted by start date

## Technologies

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- Radix UI
- Shadcn UI

## License

Private project
