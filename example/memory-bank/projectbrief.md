# Project Brief: Eagle Filter Explorer Plugin

## Overview
A React-based Eagle plugin that provides advanced filtering and file exploration capabilities for Eagle libraries. Uses `eagle-cooltils` package for filter operations.

## Core Requirements
1. **Visual Filter Builder** - GUI for creating complex, condition-based filters
2. **File Explorer** - Tree-based folder navigation with item counts
3. **Item Grid** - Thumbnail display with metadata
4. **eagle-cooltils Integration** - Uses filter API directly on Eagle Items

## Goals
- Test and demonstrate `eagle-cooltils/universal/filter` capabilities
- Provide intuitive visual filter construction
- Support complex AND/OR condition logic
- Real-time filtering with result counts

## Non-Goals
- Modifying library items (read-only)
- Replacing Eagle's native search
- Persisting custom filters (future feature)

## Tech Stack
- React 18
- TypeScript
- Vite (bundler)
- TailwindCSS + DaisyUI (styling)
- eagle-cooltils (filter utilities)

## Target Users
- Eagle power users needing complex searches
- Developers testing eagle-cooltils filter functionality
