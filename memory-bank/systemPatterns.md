# System Patterns: eagle-cooltils

## Architecture Overview

```
eagle-cooltils/
├── src/
│   ├── index.ts           # Main barrel export
│   ├── eagle.d.ts         # Eagle Plugin API type definitions
│   ├── universal/         # Cross-platform utilities
│   │   ├── index.ts
│   │   ├── filter.ts      # Item filtering system
│   │   ├── webapi.ts      # Eagle Web API client
│   │   └── bareio/        # Bare-metal library IO
│   │       ├── core.ts
│   │       ├── items.ts
│   │       ├── folders.ts
│   │       ├── smart-folders.ts
│   │       ├── tags.ts
│   │       └── quick-access.ts
│   ├── win/               # Windows-specific utilities
│   │   ├── index.ts
│   │   └── symlink.ts
│   ├── mac/               # macOS-specific utilities
│   │   └── index.ts
│   └── utils/             # General utilities
│       └── index.ts
├── dist/                  # Build output
└── tests/                 # Test files
```

## Design Patterns

### 1. Platform-Based Modules
Organize by platform compatibility:
```ts
// Cross-platform
import { filterItems, ItemFilterBuilder } from 'eagle-cooltils/universal';

// Platform-specific
import { createLibrarySymlink } from 'eagle-cooltils/win';
import { ... } from 'eagle-cooltils/mac';
```

### 2. Fluent Builder Pattern (Filter API)
Chain-based API for intuitive filter construction:
```ts
const filter = new ItemFilterBuilder()
  .where('tags').includesAny(['photo', 'image'])
  .and('ext').is('png')
  .and('star').gte(3)
  .build();

const results = filterItems(items, filter);
```

### 3. Eagle Item Compatibility
Filter functions work directly with Eagle's Item class (private fields with getters):
```ts
// Works directly - no conversion needed
const items = await eagle.item.getAll();
const filtered = filterByExtension(items, 'png');
```

Internal normalization handles undefined values:
```ts
function getItemValue(item, property) {
  const value = item[property];
  if (property === 'star' && value === undefined) return 0;
  if ((property === 'tags' || property === 'folders') && !Array.isArray(value)) return [];
  return value;
}
```

### 4. Type-Safe Exports
All exports properly typed with TypeScript.

### 5. Error Handling Pattern
Consistent error handling across utilities:
```ts
async function safeOperation<T>(
  fn: () => Promise<T>,
  fallback?: T
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    console.error('[eagle-cooltils]', error);
    return fallback;
  }
}
```

### 6. Tree-Shaking Support
Use named exports for optimal bundling:
```ts
// ✅ Good - tree-shakeable
export { filterItems, ItemFilterBuilder } from './universal/filter';

// ❌ Avoid - imports entire module
export default { universal, win, mac, utils };
```

### 7. CJS Compatibility for Eagle Plugins
Eagle plugins run in Electron's renderer with Node.js integration. Key learnings:

**Node.js Modules Work**: Eagle plugins CAN use `fs`, `path`, etc.
```ts
import { promises as fs } from 'node:fs';
import path from 'node:path';
// Works in Eagle plugins!
```

**Bundling Strategy for Plugins**:
- Bundle eagle-cooltils **inline** (don't externalize)
- Externalize only Node.js built-ins (`fs`, `path`, etc.)
- Use **CJS output format** - ESM bare imports like `import 'fs'` fail in Electron

```ts
// vite.config.ts for Eagle plugin
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['fs', 'path', 'node:fs', 'node:path', ...],
      output: {
        format: 'cjs', // REQUIRED for Electron
        entryFileNames: 'assets/[name].js',
      },
    },
  },
});
```

## Module Boundaries
- Each module is self-contained
- No circular dependencies
- Utilities in `utils/` are pure functions

## Testing Strategy
- Unit tests for pure utility functions
- Integration tests require Eagle environment mocking
- Real-world testing via test plugin
- Use Vitest for fast test execution

## Shared Models (src/universal/models.ts)

### Overview
Shared plain object representations of Eagle's private-field classes. Use these when you need to extract, serialize, or compare Eagle API objects.

### Types
| Type | Purpose |
|------|---------|
| `PlainItem` | Plain object copy of Eagle Item (id, name, ext, url, tags, folders, star, annotation, modificationTime, noThumbnail) |
| `PlainFolder` | Plain object copy of Eagle Folder (id, name, children as PlainFolder[]) |
| `LibraryState` | Library path + name snapshot |
| `ConfigState` | Library metadata.json mtime |

### Helper Functions
| Function | Purpose |
|----------|---------|
| `extractItem(item)` | Extract PlainItem from Eagle Item |
| `extractFolder(folder)` | Extract PlainFolder from Eagle Folder (recursive children) |
| `getLibraryState()` | Get current LibraryState from `eagle.library` API |

### Why Shared Models?
Eagle's Item/Folder classes use private fields (`#id`, `#name`) with getters. The spread operator `...item` does **NOT** copy private field values. These shared helpers ensure consistent extraction across the codebase.

```ts
// ❌ Wrong - spread doesn't work with private fields
const plain = { ...item }; // { } - empty!

// ✅ Correct - use extractItem
import { extractItem } from 'eagle-cooltils/universal';
const plain = extractItem(item); // { id, name, ext, ... }
```

## Subscription System (src/universal/subscribe.ts)

### Overview
Event subscription system for detecting changes in Eagle library state. Provides reactive callbacks when items, folders, or library configuration changes.

### Architecture

```
SubscriptionManager (Singleton)
├── LibraryWatcher (1s fixed interval - parent)
│   ├── Monitors eagle.library.path
│   ├── On change: resets all child subscribers
│   └── Initializes child watchers on first run
├── ItemSelectionWatcher (configurable interval)
│   ├── Uses eagle.item.getSelected()
│   ├── Compares ID arrays for changes
│   └── maxEqualLookups: -1 = all, N = first N IDs
├── FolderSelectionWatcher (configurable interval)
│   ├── Uses eagle.folder.getSelected()
│   └── Same comparison logic as ItemWatcher
└── LibraryConfigWatcher (configurable interval)
    ├── Uses bareio to check metadata.json mtime
    └── Triggers on mtime change
```

### API Design

```ts
interface SubscribeOptions {
  interval?: number;        // Check interval in ms (default: 500)
  maxEqualLookups?: number; // -1 = compare all IDs (default: -1)
}

interface ChangeEvent<T> {
  previous: T;
  current: T;
  timestamp: number;
}

interface Unsubscribe {
  (): void;
}

// Functions
function onItemChange(
  callback: (event: ChangeEvent<Item[]>) => void,
  options?: SubscribeOptions
): Unsubscribe;

function onFolderChange(
  callback: (event: ChangeEvent<Folder[]>) => void,
  options?: SubscribeOptions
): Unsubscribe;

function onLibraryConfigChange(
  callback: (event: ChangeEvent<{ mtime: number }>) => void,
  options?: Omit<SubscribeOptions, 'maxEqualLookups'>
): Unsubscribe;

function onLibraryChange(
  callback: (event: ChangeEvent<{ path: string; name: string }>) => void
): Unsubscribe;
// Note: Fixed 1s interval, no options
```

### Implementation Details

1. **SubscriptionManager Singleton**
   - Lazy initialization on first subscribe
   - Reference counting for cleanup
   - Library watcher always runs at 1s when any subscription active

2. **Change Detection Algorithm**
   ```ts
   function hasSelectionChanged(prev: string[], curr: string[], maxLookups: number): boolean {
     if (prev.length !== curr.length) return true;
     const limit = maxLookups === -1 ? prev.length : Math.min(maxLookups, prev.length);
     for (let i = 0; i < limit; i++) {
       if (prev[i] !== curr[i]) return true;
     }
     return false;
   }
   ```

3. **Library Change Cascade**
   - When `eagle.library.path` changes:
     - Clear all cached previous states
     - Force immediate re-evaluation of all active watchers
     - Emit change events with new state as both prev and current

4. **Cleanup**
   - `Unsubscribe` function removes callback
   - When all callbacks for a watcher removed, stop its interval
   - When all watchers stopped, stop library watcher

### Edge Cases
- Handle Eagle API not available (outside plugin context)
- Handle bareio fs.stat failures gracefully
- Debounce rapid library switches
- Extract Item/Folder properties explicitly (private fields issue)

### File Structure
```ts
// src/universal/subscribe.ts
export { 
  onItemChange,
  onFolderChange, 
  onLibraryConfigChange,
  onLibraryChange,
  type ChangeEvent,
  type SubscribeOptions,
  type Unsubscribe
};
```

## User Config System (src/universal/config.ts)

### Overview
Persistent config storage at `~/.eaglecooler/config/` with multiple scoping options.

### Storage Structure
```
~/.eaglecooler/config/
├── global.json          # Shared across all plugins/libraries
├── globalPerPlugin.json # Per-plugin, keyed by SHA256(pluginId)
├── library.json         # Per-library, keyed by SHA256(path or name or UUID)
└── plugin.json          # Per-plugin
```

### Config Scopes
| Factory | Scope | Key |
|---------|-------|-----|
| `createGlobalConfig()` | All plugins, all libraries | Root level |
| `createPluginGlobalConfig()` | Per-plugin, all libraries | SHA256(pluginId) |
| `createPluginConfig()` | Per-plugin | SHA256(pluginId) |
| `createLibraryConfig()` | Per-library, all plugins | SHA256(libraryPath) |
| `createLibraryPluginConfig()` | Per-library, per-plugin | SHA256(libraryPath + pluginId) |
| `createLibraryUuidConfig()` | Per-library (UUID), all plugins | SHA256(libraryUUID) |
| `createLibraryUuidPluginConfig()` | Per-library (UUID), per-plugin | SHA256(libraryUUID + pluginId) |

### Library UUID Mode
The `useLibraryUuid` option solves the problem of config loss when library folders are moved/renamed.

**How it works:**
1. On first access, creates `cooler-uuid.json` in library root with UUID v4
2. Subsequent accesses read the existing UUID
3. Config key is `SHA256(uuid)` instead of `SHA256(path)`

**Library file structure with UUID:**
```
MyLibrary.library/
├── metadata.json
├── cooler-uuid.json   ← { "uuid": "550e8400-e29b-41d4-..." }
├── images/
└── ...
```

**Usage:**
```ts
// Config survives library moves/renames
const config = createLibraryUuidConfig();
await config.set('viewMode', 'grid');

// With plugin scoping
const pluginConfig = createLibraryUuidPluginConfig();
await pluginConfig.set('lastUsed', Date.now());
```

**Helper exports:**
- `getOrCreateLibraryUuid()` - Get or auto-create library UUID
- `readLibraryUuid()` - Read UUID (returns undefined if not exists)
- `writeLibraryUuid(uuid)` - Write UUID to library
- `LIBRARY_UUID_FILENAME` - Constant: `'cooler-uuid.json'`

### Initialization
```ts
eagle.onPluginCreate((plugin) => {
  initEagleConfig(plugin);  // Required before using config
});
```

### Cross-Platform Path
Uses `eagle.os.homedir()` for `~` expansion:
- Windows: `C:\Users\{user}\.eaglecooler\config\`
- macOS: `/Users/{user}/.eaglecooler/config/`

## Documentation Standards

### README Code Examples
- Keep code demos **short** (max 10 lines)
- Focus on **capability demonstration**, not full implementation
- Show imports and one clear use case per feature
- Use tables for listing options/scopes
- Separate features with horizontal rules (`---`)

### Memory Bank Updates
- Update `activeContext.md` when focus changes
- Update `progress.md` when features complete
- Add new patterns to `systemPatterns.md`
- Keep decision log current
