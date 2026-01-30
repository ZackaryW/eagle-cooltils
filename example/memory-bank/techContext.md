# Tech Context: Eagle Filter Explorer

## Technology Stack

### Core
- **Framework**: React 18.3
- **Language**: TypeScript 5.x
- **Bundler**: Vite 6.x
- **Styling**: TailwindCSS 3.x + DaisyUI 3.x

### Dependencies
- **react / react-dom**: UI framework
- **daisyui**: Component library (buttons, cards, badges)
- **eagle-cooltils**: Filter utilities (copied to node_modules)

### Dev Dependencies
- **@types/node**: Node.js types for require()
- **@vitejs/plugin-react**: React HMR support
- **typescript**: Type checking
- **postcss / autoprefixer**: CSS processing

## Technical Constraints

### Eagle Plugin Environment
- Chromium 107 (Electron)
- Node.js available via require()
- CommonJS module system (no native ESM)
- Plugin runs in renderer process

### Module Resolution
- eagle-cooltils must be copied to `node_modules/` AND `dist/node_modules/`
- Use `.cjs` extension for explicit CommonJS import
- Types mirrored locally since TS can't resolve copied modules

### Build Requirements
- `pnpm build` outputs to `dist/`
- `dist/index.html` is plugin entry point
- Must copy `node_modules/eagle-cooltils` to `dist/` after build

## Development Setup

```bash
# Install dependencies
pnpm install

# Copy eagle-cooltils (from eagle-cooltils repo)
mkdir -p node_modules/eagle-cooltils
cp -r ../eagle-cooltils/dist/* node_modules/eagle-cooltils/
cp ../eagle-cooltils/package.json node_modules/eagle-cooltils/

# Development
pnpm dev

# Production build
pnpm build

# Copy eagle-cooltils to dist for runtime
mkdir -p dist/node_modules/eagle-cooltils
cp -r node_modules/eagle-cooltils/* dist/node_modules/eagle-cooltils/
```

## Plugin Manifest

```json
{
  "id": "eagle-filter-explorer",
  "name": "Eagle Filter Explorer",
  "main": { "url": "dist/index.html", "width": 1200, "height": 800 },
  "devTools": true
}
```

## Eagle API Usage
- `eagle.item.getAll()` - Load all items
- `eagle.folder.getAll()` - Load all folders
- `eagle.library.name` - Current library name
- `eagle.app.isDarkColors()` - Theme detection
- `eagle.onPluginCreate()` - Initialization hook
