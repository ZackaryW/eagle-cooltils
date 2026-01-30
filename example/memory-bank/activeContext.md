# Active Context: Eagle Filter Explorer

## Current Focus
**Filter Persistence** - Added save/load filter presets using eagle-cooltils config system.

## Recent Changes
- Integrated `useFilterPresets` hook for saving/loading filter presets
- Added `useLastFilter` hook to remember the last used filter per library
- Updated `FilterBuilder` component with Save/Load buttons and modals
- Filter presets stored at `~/.eaglecooler/config/library.json` (per-library, per-plugin)
- Auto-restores last used filter on plugin load
- Fixed folder display, thumbnail errors, and non-image handling

## Active Decisions

### eagle-cooltils Integration via CJS
**Why**: Eagle plugins run in Node.js context with CommonJS require(). ESM imports fail, so we use `require('eagle-cooltils/universal/index.cjs')`.

### Type Mirroring
**Why**: TypeScript can't resolve eagle-cooltils types at build time (copied to node_modules). We mirror filter types locally in `useEagle.tsx`.

### EagleProvider Pattern
**Why**: Centralized state for items/folders, with hooks for filtered views.

### Explicit Property Extraction for Eagle Objects
**Why**: Eagle's Item and Folder classes use private fields with getters. Spread operator doesn't copy values - must access each property explicitly.

## Current Considerations
- Save/load filter presets
- Drag-and-drop items to folders
- Keyboard shortcuts for power users
- Performance with 10k+ items

## Patterns to Follow
- Components in `src/components/`
- Hooks in `src/hooks/`
- Types in `src/types/`
- Use DaisyUI components for consistent styling
- Use TailwindCSS utilities for layout
- **Always add `onError` handler for images**
- **Extract Eagle object properties explicitly, never spread**

## Blockers
None currently.
