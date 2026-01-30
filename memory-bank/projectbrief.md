# Project Brief: eagle-cooltils

## Overview
A JS/TS utility package designed for the Eagle.cool ecosystem, providing common utilities and helpers for Eagle plugin development.

## Core Requirements
1. **TypeScript-first** - Full TypeScript support with proper type definitions
2. **Eagle Plugin Compatible** - Works within Eagle's Electron plugin environment and HTTP API
3. **Modular Architecture** - Tree-shakeable utilities that can be imported individually
4. **Zero/Minimal Dependencies** - Keep bundle size small for plugin distribution

## Target Users
- Eagle.cool plugin developers
- Developers building Window, Background Service, Format Extension, or Inspector Extension plugins

## Goals
- Reduce boilerplate code in Eagle plugin development
- Provide type-safe wrappers for common Eagle API operations
- Offer utility functions for file handling, UI helpers, and data transformations
- Standardize patterns across Eagle plugins

## Scope
- Platform-based utility modules (universal/win/mac/utils)
- Eagle Web API client (HTTP API) for standalone usage
- Common data transformation utilities

## Success Criteria
- Easy installation via npm/yarn/pnpm
- Works out-of-the-box in Eagle plugin projects
- Strong TypeScript types for public APIs
- Well-documented API
