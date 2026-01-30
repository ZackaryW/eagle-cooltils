import { promises as fs } from 'node:fs';
import path from 'node:path';
import { BareLibraryCore } from '../universal/bareio/core';

export interface CreateSymlinkOptions {
	/**
	 * Overwrite the link path if it already exists.
	 * Defaults to false.
	 */
	overwrite?: boolean;
	/**
	 * Symlink type for Windows directories.
	 * Defaults to 'junction' to avoid admin requirement.
	 * Ignored for file symlinks.
	 */
	type?: 'junction' | 'dir';
	/**
	 * Create parent directories for the link path if missing.
	 * Defaults to true.
	 */
	ensureParentDir?: boolean;
}

export interface CleanupResult {
	/** Number of dangling symlinks removed */
	removed: number;
	/** Paths of removed symlinks */
	removedPaths: string[];
	/** Number of valid symlinks retained */
	retained: number;
	/** Errors encountered during cleanup */
	errors: Array<{ path: string; error: Error }>;
}

/**
 * Reference to an Eagle Item for symlink creation.
 * Can be the Item object (with filePath) or just the filePath string.
 */
export type ItemRef = { filePath: string } | string;

type LibraryRef = string | BareLibraryCore;

/**
 * Create a Windows symlink to a specific entry's info directory.
 */
export async function createEntrySymlink(
	library: LibraryRef,
	entryId: string,
	linkPath: string,
	options: CreateSymlinkOptions = {}
): Promise<string> {
	const core = resolveLibraryCore(library);
	const targetDir = core.itemInfoDir(entryId);
	return createDirSymlink(targetDir, linkPath, options);
}

/**
 * Create a Windows symlink to the library images directory.
 */
export async function createImagesSymlink(
	library: LibraryRef,
	linkPath: string,
	options: CreateSymlinkOptions = {}
): Promise<string> {
	const core = resolveLibraryCore(library);
	const targetDir = core.imagesPath();
	return createDirSymlink(targetDir, linkPath, options);
}

/**
 * Create a Windows symlink to an Eagle Item's file.
 * Uses the Item.filePath property from the Eagle API.
 *
 * @param item - Eagle Item object or the file path string (Item.filePath)
 * @param linkPath - Path where the symlink will be created
 * @param options - Symlink options
 * @returns The resolved link path
 *
 * @example
 * ```ts
 * // Using Eagle API Item object
 * const item = await eagle.item.getById('abc123');
 * await createItemFileSymlink(item, 'C:/links/my-image.jpg');
 *
 * // Using file path directly
 * await createItemFileSymlink(item.filePath, 'C:/links/my-image.jpg');
 * ```
 */
export async function createItemFileSymlink(
	item: ItemRef,
	linkPath: string,
	options: CreateSymlinkOptions = {}
): Promise<string> {
	const targetPath = typeof item === 'string' ? item : item.filePath;
	return createFileSymlink(targetPath, linkPath, options);
}

/**
 * Check if a symlink is dangling (target no longer exists).
 *
 * @param linkPath - Path to the symlink to check
 * @returns true if dangling, false if valid, undefined if not a symlink
 */
export async function isDanglingSymlink(linkPath: string): Promise<boolean | undefined> {
	const resolvedLink = path.resolve(linkPath);

	const linkStat = await fs.lstat(resolvedLink).catch(() => undefined);
	if (!linkStat?.isSymbolicLink()) {
		return undefined; // Not a symlink
	}

	// Check if target exists
	const targetExists = await fs.stat(resolvedLink).then(() => true).catch(() => false);
	return !targetExists;
}

/**
 * Find all dangling symlinks in a directory.
 *
 * @param dirPath - Directory to scan for symlinks
 * @param recursive - Whether to scan subdirectories (default: false)
 * @returns Array of paths to dangling symlinks
 */
export async function findDanglingSymlinks(
	dirPath: string,
	recursive = false
): Promise<string[]> {
	const resolvedDir = path.resolve(dirPath);
	const dangling: string[] = [];

	const entries = await fs.readdir(resolvedDir, { withFileTypes: true }).catch(() => []);

	for (const entry of entries) {
		const fullPath = path.join(resolvedDir, entry.name);

		if (entry.isSymbolicLink()) {
			const isDangling = await isDanglingSymlink(fullPath);
			if (isDangling) {
				dangling.push(fullPath);
			}
		} else if (recursive && entry.isDirectory()) {
			const subDangling = await findDanglingSymlinks(fullPath, true);
			dangling.push(...subDangling);
		}
	}

	return dangling;
}

/**
 * Remove dangling symlinks from a directory.
 *
 * @param dirPath - Directory to scan and clean
 * @param recursive - Whether to scan subdirectories (default: false)
 * @returns Cleanup result with counts and details
 *
 * @example
 * ```ts
 * const result = await cleanupDanglingSymlinks('C:/my-links', true);
 * console.log(`Removed ${result.removed} dangling symlinks`);
 * ```
 */
export async function cleanupDanglingSymlinks(
	dirPath: string,
	recursive = false
): Promise<CleanupResult> {
	const resolvedDir = path.resolve(dirPath);
	const result: CleanupResult = {
		removed: 0,
		removedPaths: [],
		retained: 0,
		errors: [],
	};

	const entries = await fs.readdir(resolvedDir, { withFileTypes: true }).catch(() => []);

	for (const entry of entries) {
		const fullPath = path.join(resolvedDir, entry.name);

		if (entry.isSymbolicLink()) {
			const isDangling = await isDanglingSymlink(fullPath);

			if (isDangling) {
				try {
					await fs.unlink(fullPath);
					result.removed++;
					result.removedPaths.push(fullPath);
				} catch (error) {
					result.errors.push({ path: fullPath, error: error as Error });
				}
			} else {
				result.retained++;
			}
		} else if (recursive && entry.isDirectory()) {
			const subResult = await cleanupDanglingSymlinks(fullPath, true);
			result.removed += subResult.removed;
			result.removedPaths.push(...subResult.removedPaths);
			result.retained += subResult.retained;
			result.errors.push(...subResult.errors);
		}
	}

	return result;
}

function resolveLibraryCore(library: LibraryRef): BareLibraryCore {
	return typeof library === 'string' ? new BareLibraryCore(library) : library;
}

async function createFileSymlink(
	targetFile: string,
	linkPath: string,
	options: CreateSymlinkOptions
): Promise<string> {
	const resolvedTarget = path.resolve(targetFile);
	const resolvedLink = path.resolve(linkPath);
	const { overwrite = false, ensureParentDir = true } = options;

	const targetStat = await fs.stat(resolvedTarget).catch(() => undefined);
	if (!targetStat?.isFile()) {
		throw new Error(`Target file not found: ${resolvedTarget}`);
	}

	const existing = await fs.lstat(resolvedLink).catch(() => undefined);
	if (existing) {
		if (!overwrite) return resolvedLink;
		await fs.rm(resolvedLink, { force: true });
	}

	if (ensureParentDir) {
		await fs.mkdir(path.dirname(resolvedLink), { recursive: true });
	}

	// File symlinks on Windows use 'file' type
	await fs.symlink(resolvedTarget, resolvedLink, 'file');
	return resolvedLink;
}

async function createDirSymlink(
	targetDir: string,
	linkPath: string,
	options: CreateSymlinkOptions
): Promise<string> {
	const resolvedTarget = path.resolve(targetDir);
	const resolvedLink = path.resolve(linkPath);
	const { overwrite = false, type = 'junction', ensureParentDir = true } = options;

	const targetStat = await fs.stat(resolvedTarget).catch(() => undefined);
	if (!targetStat?.isDirectory()) {
		throw new Error(`Target directory not found: ${resolvedTarget}`);
	}

	const existing = await fs.lstat(resolvedLink).catch(() => undefined);
	if (existing) {
		if (!overwrite) return resolvedLink;
		await fs.rm(resolvedLink, { recursive: true, force: true });
	}

	if (ensureParentDir) {
		await fs.mkdir(path.dirname(resolvedLink), { recursive: true });
	}

	await fs.symlink(resolvedTarget, resolvedLink, type);
	return resolvedLink;
}
