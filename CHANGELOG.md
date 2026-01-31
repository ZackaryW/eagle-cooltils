# Changelog

## 0.0.2

- Added auto token resolution for `EagleWebApi` from `/api/application/info`
- Token cached internally with concurrent request handling
- Added `clearTokenCache()` method for manual cache invalidation

## 0.0.1

- Initial release
- Eagle Web API client (`EagleWebApi`)
- Item filtering system with fluent `ItemFilterBuilder` API
- Subscription system (`onLibraryChange`, `onItemChange`, `onFolderChange`, etc.)
- User config system (`EagleUserConfig`) with global/plugin/library scoping
- Bareio direct file access (folders, smart folders, tags, items)
- Shared models and extraction helpers
- Windows symlink helpers
