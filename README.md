# eagle-cooltils

A TypeScript utility package for [Eagle.cool](https://eagle.cool) plugin development.

## Features

- 🦅 **Eagle Plugin Ready** - Works with Eagle's Electron plugin system
- 📦 **TypeScript First** - Full type definitions for Eagle Plugin API
- 🌳 **Tree-Shakeable** - Import only what you need
- ⚡ **Zero Dependencies** - Minimal footprint
- 🎯 **ESM & CJS** - Dual module support
- 🔧 **Cross-Platform** - Universal + platform-specific modules

## Installation

```bash
pnpm add eagle-cooltils
```

## Modules Overview

| Module | Description |
|--------|-------------|
| `eagle-cooltils/universal` | Cross-platform utilities (filter, config, subscriptions, bareio) |
| `eagle-cooltils/win` | Windows-specific utilities (symlinks) |
| `eagle-cooltils/mac` | macOS-specific utilities |

---

## Item Filtering

Fluent API for filtering Eagle items with complex conditions.

```ts
import { ItemFilterBuilder, filterItems } from 'eagle-cooltils/universal';

const filter = new ItemFilterBuilder()
  .where('tags').includesAny(['photo', 'design'])
  .and('star').gte(3)
  .and('ext').is('png')
  .build();

const results = filterItems(items, filter);
```

### Quick Filters

```ts
import { filterByTags, filterByRating, filterUntagged } from 'eagle-cooltils/universal';

const tagged = filterByTags(items, ['important']);
const starred = filterByRating(items, 4);
const untagged = filterUntagged(items);
```

---

## User Config

Persistent config storage at `~/.eaglecooler/config/` with multiple scoping options.

```ts
import { EagleUserConfig, initEagleConfig, createLibraryPluginConfig } from 'eagle-cooltils/universal';

// Initialize in onPluginCreate
eagle.onPluginCreate((plugin) => initEagleConfig(plugin));

// Per-library, per-plugin config
const config = createLibraryPluginConfig();
await config.set('theme', 'dark');
const theme = await config.get('theme');
```

### Config Scopes

| Factory | Scope |
|---------|-------|
| `createGlobalConfig()` | Shared across all plugins/libraries |
| `createPluginGlobalConfig()` | Per-plugin, all libraries |
| `createPluginConfig()` | Per-plugin |
| `createLibraryConfig()` | Per-library, all plugins |
| `createLibraryPluginConfig()` | Per-library, per-plugin |

---

## Subscriptions

React to Eagle state changes with polling-based subscriptions.

```ts
import { onItemChange, onLibraryChange, onFolderChange } from 'eagle-cooltils/universal';

const unsub = onItemChange((event) => {
  console.log('Selection:', event.current.length, 'items');
}, { interval: 300 });

onLibraryChange((event) => console.log('Switched to:', event.current.name));

// Cleanup
unsub();
```

### Available Subscriptions

| Function | Monitors |
|----------|----------|
| `onItemChange` | Selected items |
| `onFolderChange` | Selected folders |
| `onLibraryChange` | Library switch |
| `onLibraryConfigChange` | Library metadata.json |
| `onLibraryFolderChange` | Library directory mtime |

---

## Bare I/O

Direct file system access to Eagle library data (read/write JSON files).

```ts
import { BareLibrary } from 'eagle-cooltils/universal';

const lib = new BareLibrary('/path/to/library.library');

// Read library metadata
const meta = await lib.core.readMetadata();

// Read/write items
const item = await lib.items.read('item-id');
await lib.items.write('item-id', { name: 'New Name', tags: ['updated'] });

// Read folders, smart folders, tags
const folders = await lib.folders.read();
const smartFolders = await lib.smartFolders.read();
```

---

## Models & Extraction

Convert Eagle's private-field objects to plain objects.

```ts
import { extractItem, extractFolder, getLibraryState } from 'eagle-cooltils/universal';

const plainItem = extractItem(eagleItem);  // Plain object, spreadable
const plainFolder = extractFolder(eagleFolder);
const state = getLibraryState();  // { name, path, modificationTime }
```

---

## Web API Client

HTTP client for Eagle's localhost API (port 41595).

```ts
import { EagleWebApi } from 'eagle-cooltils/universal';

const api = new EagleWebApi({ token: 'your-token' });
const items = await api.item.list({ limit: 100 });
await api.item.addFromUrl({ url: 'https://example.com/image.png' });
```

---

## Windows Symlinks

Create symlinks to Eagle library entries and items (Windows-specific).

```ts
import { createEntrySymlink, createItemFileSymlink, cleanupDanglingSymlinks } from 'eagle-cooltils/win';

// Symlink to item's info directory
await createEntrySymlink(libraryPath, itemId, 'C:/Links/my-item');

// Symlink to item's actual file
await createItemFileSymlink(item, 'C:/Links/my-image.png');

// Cleanup broken symlinks
const result = await cleanupDanglingSymlinks('C:/Links');
```

---

## Eagle Plugin Types

Full TypeScript definitions for Eagle's Plugin API.

```ts
// Available globally when using eagle-cooltils
declare const eagle: {
  item: { getAll(), getSelected(), addFromPath(), ... };
  folder: { getAll(), create(), ... };
  library: { name, path, info() };
  app: { version, theme, platform, ... };
  // ... and more
};
```

---

## Development

```bash
pnpm install     # Install dependencies
pnpm dev         # Watch mode
pnpm build       # Production build
pnpm test        # Run tests
pnpm typecheck   # Type check
```

## Environment

- **Chromium 107** - Modern JS features
- **Node.js 18+** - Node APIs available
- **`eagle` global** - Eagle Plugin API

## License

MIT
