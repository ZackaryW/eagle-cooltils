# Active Context: eagle-cooltils

## Current Focus
**Universal Config System** - Added `src/universal/config.ts` for cross-platform user config management.

## Recent Changes
- Added `EagleUserConfig` class for managing plugin/library/global configs
- Config stored at `~/.eaglecooler/config/` with JSON files
- Supports scoping by: global, per-plugin, per-library, or combinations
- Uses SHA256 hashing for library/plugin identification keys
- Added Windows symlink helpers for library entries and images
## Active Decisions

### Build Tool Choice: tsup
**Why**: Fast esbuild-based bundler with built-in TypeScript and DTS support. Simple configuration, produces ESM + CJS outputs.

### Module Structure: Platform-based
**Why**: Organizing by platform compatibility (universal/win/mac) matches requested structure.

### TypeScript Strict Mode
**Why**: Catch errors early, provide better IntelliSense for consumers.

## Current Considerations
- What specific utilities are needed in each module?
- Platform detection strategy for conditional exports

## Patterns to Follow
- Use `src/` for source code
- Use barrel exports (`index.ts`) for clean imports
- Document all public APIs with TSDoc comments
- Keep functions small and focused

## Blockers
None currently.
