# Tech Context: eagle-cooltils

## Technology Stack

### Core
- **Language**: TypeScript 5.x
- **Runtime Target**: Node 18+
- **Module System**: ESM with CJS fallback
- **Build Tool**: tsup (esbuild-based, fast builds)

### Development
- **Package Manager**: pnpm (recommended)
- **Testing**: Vitest
- **Linting**: ESLint 9 (flat config) + Prettier
- **Documentation**: TypeDoc or TSDoc comments

## Technical Constraints

### Eagle Plugin Environment
- Chromium 107 engine (modern JS features available)
- Node.js APIs available (plugin runtime)
- Runs in Electron renderer process
 - Web API available over HTTP (localhost)

### Package Requirements
- Must support both ESM and CommonJS imports
- Must provide `.d.ts` type definitions
- Should be tree-shakeable
- Minimal runtime dependencies

## Dependencies Strategy
- **Zero runtime dependencies** where possible
- Dev dependencies for build/test tooling only
- If needed, prefer small, focused packages

## Build Output
```
dist/
├── index.js        # ESM entry
├── index.cjs       # CJS entry
├── index.d.ts      # Type definitions
└── [modules]/      # Individual module exports
```

## Development Setup
```bash
# Install dependencies
pnpm install

# Development with watch
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck
```

## Eagle API Access
Eagle Web API is accessed via HTTP (default port 41595) using an API token.
