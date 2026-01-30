# Product Context: eagle-cooltils

## Why This Project Exists
Eagle.cool is a powerful asset management application with an Electron-based plugin system. Plugin developers often need to write repetitive boilerplate code for common operations. This utility package consolidates these patterns into a reusable, well-typed library.

## Problems It Solves
1. **Repetitive Code** - Common patterns are duplicated across plugins
2. **Boilerplate Overhead** - Setting up a shared utility layer for plugins
3. **Inconsistent Patterns** - Platform-specific behavior handled inconsistently

## How It Should Work
```ts
import { EagleWebApi } from 'eagle-cooltils/universal';

const api = new EagleWebApi({ token: 'YOUR_TOKEN' });
const folders = await api.folder.list();
```

## User Experience Goals
- **Instant Productivity** - Get started with one `npm install`
- **Discoverable API** - IntelliSense-friendly with JSDoc comments
- **Predictable Behavior** - Consistent error handling and return types
- **Flexible Usage** - Works with any Eagle plugin type

## Key Differentiators
- First-class TypeScript support
- Tree-shakeable ESM exports
- Platform-based module structure
- Well-documented with examples
