/**
 * Windows-specific utilities
 * @module win
 */

export {
	createEntrySymlink,
	createImagesSymlink,
	createItemFileSymlink,
	isDanglingSymlink,
	findDanglingSymlinks,
	cleanupDanglingSymlinks,
} from './symlink';
export type { CreateSymlinkOptions, CleanupResult, ItemRef } from './symlink';
