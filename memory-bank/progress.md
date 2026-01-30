# Progress: eagle-cooltils

## Project Status: 🟡 In Progress

## What Works
- ✅ Git repository initialized
- ✅ Memory bank documentation created
- ✅ Project scope defined
- ✅ Architecture patterns established
- ✅ New Eagle Plugin API typings file created at `src/eagle.d.ts`
- ✅ Item filtering system (`src/universal/filter.ts`)
- ✅ Fluent ItemFilterBuilder API
- ✅ Direct Eagle Item compatibility (no conversion needed)
- ✅ Tested with React plugin on real library
- ✅ Subscription system (`src/universal/subscribe.ts`)
  - `onLibraryChange` - fixed 1s interval, parent watcher
  - `onItemChange` - configurable interval, selection monitoring
  - `onFolderChange` - configurable interval, selection monitoring
  - `onLibraryConfigChange` - bareio mtime monitoring
  - `onLibraryFolderChange` - library directory mtime monitoring
- ✅ User Config system (`src/universal/config.ts`)
  - `EagleUserConfig` class with global/plugin/library scoping
  - Stored at `~/.eaglecooler/config/` (cross-platform via `eagle.os.homedir()`)
  - Factory functions: `createGlobalConfig()`, `createPluginConfig()`, etc.
  - SHA256 key generation for library/plugin identification
- ✅ Shared models (`src/universal/models.ts`)
  - `PlainItem`, `PlainFolder` - plain object types
  - `extractItem()`, `extractFolder()` - extraction helpers
  - `getLibraryState()` - library snapshot helper
- ✅ Integrated subscriptions into React test plugin
  - Live `selectedItems` / `selectedFolders` state
  - Auto-refresh folders on structure change
  - Auto-refresh on library switch

## What's Left to Build

### Phase 1: Project Setup
- [x] Initialize npm package (`package.json`)
- [x] TypeScript configuration
- [x] Build tooling (tsup)
- [x] Linting and formatting
- [x] Basic project structure (universal/, win/, mac/, utils/)
- [x] Install dependencies

### Phase 2: Core Utilities
- [x] Baseline universal utility (Web API client)
- [x] Bareio models + mutations (folders/smart folders/tag groups)
- [x] Item filtering system with fluent API
- [ ] Validate and complete Eagle Plugin API typings
- [ ] Additional universal utilities
- [x] Windows-specific symlink utilities (library entries/images)
- [ ] macOS-specific utilities
- [ ] General utilities

### Phase 3: Integration
- [x] Test with React plugin
- [ ] Smart Folder condition compatibility
- [ ] Performance benchmarks

### Phase 4: Polish
- [ ] Unit tests
- [ ] Documentation
- [ ] README with examples
- [ ] npm publish configuration

## Known Issues
- Eagle's `Item.star` can be `undefined` - handled with `?? 0` normalization

## Milestones

| Version | Status | Description |
|---------|--------|-------------|
| v0.0.1  | 🔄 In Progress | Initial project setup |
| v0.1.0  | ⏳ Planned | Initial utility set |
| v0.2.0  | ⏳ Planned | Extended utilities |
| v1.0.0  | ⏳ Planned | Stable API |

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-27 | Use tsup for bundling | Fast, simple config, ESM+CJS output |
| 2026-01-27 | TypeScript strict mode | Better DX, catch errors early |
| 2026-01-27 | Platform-based modules | Matches requested structure |
| 2026-01-28 | Node 18+ target | Modern JS/TS conventions |
| 2026-01-28 | ESLint 9 flat config | Current linting standard |
| 2026-01-27 | Zero dependencies goal | Keep bundle size minimal for plugins |
| 2026-01-30 | Fluent filter API | Intuitive chaining like `.where('tags').includesAny([...])` |
| 2026-01-30 | Handle Eagle Item directly | No need for conversion; filter works on private-field classes |
| 2026-01-30 | CJS output for plugins | Eagle plugins use Electron renderer - ESM bare imports fail, CJS require() works |
| 2026-01-30 | Bundle eagle-cooltils inline | Externalize only Node.js built-ins; bundle library code to avoid module resolution issues |
