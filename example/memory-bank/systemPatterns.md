# System Patterns: Eagle Filter Explorer

## Architecture Overview

```
test/
├── src/
│   ├── App.tsx              # Main app with layout
│   ├── main.tsx             # React entry point
│   ├── index.css            # TailwindCSS + custom styles
│   ├── components/
│   │   ├── index.ts         # Barrel exports
│   │   ├── FileExplorer.tsx # Folder tree sidebar
│   │   ├── FilterBuilder.tsx # Visual filter editor
│   │   └── ItemGrid.tsx     # Item thumbnail grid
│   ├── hooks/
│   │   └── useEagle.tsx     # Eagle context & filter hooks
│   └── types/
│       └── eagle.d.ts       # Eagle API type declarations
├── dist/                    # Production build
│   └── node_modules/        # Runtime dependencies (eagle-cooltils)
└── manifest.json            # Eagle plugin manifest
```

## Design Patterns

### 1. Context Provider Pattern
Centralized Eagle state with React Context:
```tsx
<EagleProvider>
  <AppContent />  {/* Has access to useEagle() */}
</EagleProvider>
```

### 2. Component Composition
```tsx
<App>
  <FileExplorer />      {/* Sidebar */}
  <main>
    <FilterBuilder />   {/* Filter panel */}
    <StatsBar />        {/* Result counts */}
    <ItemGrid />        {/* Item display */}
  </main>
</App>
```

### 3. Filter State Flow
```
User action → setFilter() → filteredItems (useMemo) → ItemGrid re-render
```

### 4. CJS Runtime Import
Eagle uses CommonJS, so eagle-cooltils must be imported at runtime:
```tsx
const eagleUtils = require('eagle-cooltils/universal/index.cjs');
```

### 5. Type Mirroring
Since TypeScript can't resolve the copied module, types are mirrored locally:
```tsx
// In useEagle.tsx
export type FilterMethod = 'is' | 'isNot' | ...;
export interface FilterRule { ... }
```

## Component Responsibilities

### FileExplorer
- Render folder tree from `useFolderTree()`
- Track expanded/collapsed state
- Emit `onFolderSelect(folder | null)`
- Show item counts per folder

### FilterBuilder
- Manage filter conditions state
- Render ConditionEditor → RuleEditor components
- Property/method/value inputs
- AND/OR logic controls
- Emit filter changes via `onChange(filter)`

### ItemGrid
- Render item cards in responsive grid
- Show thumbnail, name, size, dimensions
- Show star rating and tags
- Handle loading and empty states

### useEagle Hook
- Provide `items`, `folders`, `loading` state
- Provide `refresh()` for manual reload
- Provide `getItemsByFolder(id)` utility
- Re-export eagle-cooltils filter functions

## Styling
- TailwindCSS for utilities
- DaisyUI for components (btn, card, badge, etc.)
- Theme support: light/dark via `data-theme`
- Custom scrollbar styling
