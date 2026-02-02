import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

// ============================================================================
// Types
// ============================================================================

export type ConfigType = 'global' | 'pluginbased' | 'librarybased';

export interface EagleUserConfigOptions {
	/**
	 * The type of config storage:
	 * - `global`: Single global config (global.json)
	 * - `pluginbased`: Per-plugin config (plugin.json or globalPerPlugin.json)
	 * - `librarybased`: Per-library config (library.json)
	 */
	type: ConfigType;

	/**
	 * If true, the config key will include the plugin ID.
	 * For `librarybased`: key = sha256(libraryIdentifier + pluginId)
	 * For `global` with thisPluginOnly: uses globalPerPlugin.json
	 */
	thisPluginOnly?: boolean;

	/**
	 * If true, use library name as identifier instead of library path.
	 * Default: false (use path for more uniqueness)
	 * Note: Ignored if `useLibraryUuid` is true.
	 */
	useLibraryNameAsLibIdentifier?: boolean;

	/**
	 * If true, use a persistent UUID stored in the library's `cooler-uuid.json` file.
	 * This ensures config persists even if the library folder is moved/renamed.
	 * The UUID is auto-generated on first access if it doesn't exist.
	 * Default: false
	 */
	useLibraryUuid?: boolean;
}

export type ConfigData = Record<string, unknown>;

// ============================================================================
// Constants
// ============================================================================

const CONFIG_DIR_NAME = '.eaglecooler';
const CONFIG_SUBDIR = 'config';

const CONFIG_FILES = {
	global: 'global.json',
	globalPerPlugin: 'globalPerPlugin.json',
	library: 'library.json',
	plugin: 'plugin.json',
} as const;

/**
 * Filename for the library UUID file stored in the library root.
 */
const LIBRARY_UUID_FILENAME = 'cooler-uuid.json';

/**
 * Interface for the cooler-uuid.json file structure.
 */
interface LibraryUuidFile {
	uuid: string;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Generate SHA256 hash of input string (first 16 chars for readability)
 */
function sha256(input: string): string {
	return createHash('sha256').update(input).digest('hex').slice(0, 16);
}

/**
 * Get the base config directory path.
 * Uses eagle.os.homedir() for cross-platform ~ expansion.
 */
function getConfigBasePath(): string {
	const home = eagle.os.homedir();
	return path.join(home, CONFIG_DIR_NAME, CONFIG_SUBDIR);
}

/**
 * Ensure the config directory exists.
 */
async function ensureConfigDir(): Promise<string> {
	const configPath = getConfigBasePath();
	await fs.mkdir(configPath, { recursive: true });
	return configPath;
}

/**
 * Read a JSON file, return empty object if not found.
 */
async function readJsonFile(filePath: string): Promise<ConfigData> {
	try {
		const content = await fs.readFile(filePath, 'utf-8');
		return JSON.parse(content) as ConfigData;
	} catch {
		return {};
	}
}

/**
 * Write data to a JSON file.
 */
async function writeJsonFile(filePath: string, data: ConfigData): Promise<void> {
	await ensureConfigDir();
	await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Get the current plugin ID from the plugin manifest.
 * Falls back to 'unknown-plugin' if not available.
 */
function getPluginId(): string {
	// Plugin ID is typically set during onPluginCreate
	// We'll use a module-level variable that can be set
	return _currentPluginId ?? 'unknown-plugin';
}

/**
 * Get the path to the library's cooler-uuid.json file.
 */
function getLibraryUuidFilePath(): string {
	return path.join(eagle.library.path, LIBRARY_UUID_FILENAME);
}

/**
 * Read the library UUID from cooler-uuid.json.
 * Returns undefined if file doesn't exist or is invalid.
 */
async function readLibraryUuid(): Promise<string | undefined> {
	try {
		const filePath = getLibraryUuidFilePath();
		const content = await fs.readFile(filePath, 'utf-8');
		const data = JSON.parse(content) as LibraryUuidFile;
		return data.uuid;
	} catch {
		return undefined;
	}
}

/**
 * Write a UUID to the library's cooler-uuid.json file.
 */
async function writeLibraryUuid(uuid: string): Promise<void> {
	const filePath = getLibraryUuidFilePath();
	const data: LibraryUuidFile = { uuid };
	await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Get or create the library's UUID.
 * If cooler-uuid.json doesn't exist, creates it with a new UUID v4.
 */
async function getOrCreateLibraryUuid(): Promise<string> {
	const existingUuid = await readLibraryUuid();
	if (existingUuid) {
		return existingUuid;
	}

	const newUuid = randomUUID();
	await writeLibraryUuid(newUuid);
	return newUuid;
}

/**
 * Get library identifier based on config options.
 */
function getLibraryIdentifier(useNameAsIdentifier: boolean): string {
	if (useNameAsIdentifier) {
		return eagle.library.name;
	}
	return eagle.library.path;
}

// ============================================================================
// Module State
// ============================================================================

let _currentPluginId: string | undefined;

/**
 * Initialize the config system with the plugin context.
 * Call this in your onPluginCreate handler.
 *
 * @example
 * ```ts
 * eagle.onPluginCreate((plugin) => {
 *   initEagleConfig(plugin);
 * });
 * ```
 */
export function initEagleConfig(plugin: { manifest: { id?: string; name?: string } }): void {
	_currentPluginId = plugin.manifest.id ?? plugin.manifest.name ?? 'unknown-plugin';
}

// ============================================================================
// EagleUserConfig Class
// ============================================================================

/**
 * Universal config management for Eagle plugins.
 *
 * Stores config in ~/.eaglecooler/config/ with different scoping options:
 * - Global: Shared across all plugins and libraries
 * - Plugin-based: Scoped to the current plugin
 * - Library-based: Scoped to the current library
 *
 * @example
 * ```ts
 * // Global config
 * const globalConfig = new EagleUserConfig({ type: 'global' });
 * await globalConfig.set('theme', 'dark');
 *
 * // Per-plugin config
 * const pluginConfig = new EagleUserConfig({ type: 'pluginbased' });
 * await pluginConfig.set('lastUsed', Date.now());
 *
 * // Per-library config (scoped to current plugin)
 * const libraryConfig = new EagleUserConfig({
 *   type: 'librarybased',
 *   thisPluginOnly: true,
 *   useLibraryNameAsLibIdentifier: false,
 * });
 * await libraryConfig.set('viewMode', 'grid');
 * ```
 */
export class EagleUserConfig {
	readonly type: ConfigType;
	readonly thisPluginOnly: boolean;
	readonly useLibraryNameAsLibIdentifier: boolean;
	readonly useLibraryUuid: boolean;

	constructor(options: EagleUserConfigOptions) {
		this.type = options.type;
		this.thisPluginOnly = options.thisPluginOnly ?? false;
		this.useLibraryNameAsLibIdentifier = options.useLibraryNameAsLibIdentifier ?? false;
		this.useLibraryUuid = options.useLibraryUuid ?? false;
	}

	// --------------------------------------------------------------------------
	// Key Generation
	// --------------------------------------------------------------------------

	/**
	 * Get the config file path for this config type.
	 */
	private getConfigFilePath(): string {
		const basePath = getConfigBasePath();

		switch (this.type) {
			case 'global':
				if (this.thisPluginOnly) {
					return path.join(basePath, CONFIG_FILES.globalPerPlugin);
				}
				return path.join(basePath, CONFIG_FILES.global);

			case 'pluginbased':
				return path.join(basePath, CONFIG_FILES.plugin);

			case 'librarybased':
				return path.join(basePath, CONFIG_FILES.library);
		}
	}

	/**
	 * Get the key used to store/retrieve config data.
	 * For global configs without thisPluginOnly, returns null (use root level).
	 * Async because library UUID mode requires file system access.
	 */
	private async getConfigKey(): Promise<string | null> {
		switch (this.type) {
			case 'global':
				if (this.thisPluginOnly) {
					return sha256(getPluginId());
				}
				return null; // Use root level

			case 'pluginbased':
				return sha256(getPluginId());

			case 'librarybased': {
				let libId: string;
				if (this.useLibraryUuid) {
					// Use persistent UUID from library's cooler-uuid.json
					libId = await getOrCreateLibraryUuid();
				} else {
					libId = getLibraryIdentifier(this.useLibraryNameAsLibIdentifier);
				}
				if (this.thisPluginOnly) {
					return sha256(libId + getPluginId());
				}
				return sha256(libId);
			}
		}
	}

	// --------------------------------------------------------------------------
	// Core Operations
	// --------------------------------------------------------------------------

	/**
	 * Load the full config file.
	 */
	private async loadFile(): Promise<ConfigData> {
		const filePath = this.getConfigFilePath();
		return readJsonFile(filePath);
	}

	/**
	 * Save the full config file.
	 */
	private async saveFile(data: ConfigData): Promise<void> {
		const filePath = this.getConfigFilePath();
		await writeJsonFile(filePath, data);
	}

	/**
	 * Get this config's data section from the file.
	 */
	private async getSection(): Promise<ConfigData> {
		const fileData = await this.loadFile();
		const key = await this.getConfigKey();

		if (key === null) {
			return fileData;
		}

		return (fileData[key] as ConfigData) ?? {};
	}

	/**
	 * Save this config's data section to the file.
	 */
	private async saveSection(sectionData: ConfigData): Promise<void> {
		const key = await this.getConfigKey();

		if (key === null) {
			await this.saveFile(sectionData);
			return;
		}

		const fileData = await this.loadFile();
		fileData[key] = sectionData;
		await this.saveFile(fileData);
	}

	// --------------------------------------------------------------------------
	// Public API
	// --------------------------------------------------------------------------

	/**
	 * Get the entire config data for this scope.
	 */
	async getAll(): Promise<ConfigData> {
		return this.getSection();
	}

	/**
	 * Get a specific config value.
	 */
	async get<T = unknown>(key: string): Promise<T | undefined> {
		const data = await this.getSection();
		return data[key] as T | undefined;
	}

	/**
	 * Get a config value with a default fallback.
	 */
	async getOrDefault<T>(key: string, defaultValue: T): Promise<T> {
		const value = await this.get<T>(key);
		return value !== undefined ? value : defaultValue;
	}

	/**
	 * Set a specific config value.
	 */
	async set<T = unknown>(key: string, value: T): Promise<void> {
		const data = await this.getSection();
		data[key] = value;
		await this.saveSection(data);
	}

	/**
	 * Set multiple config values at once.
	 */
	async setMany(values: ConfigData): Promise<void> {
		const data = await this.getSection();
		Object.assign(data, values);
		await this.saveSection(data);
	}

	/**
	 * Remove a specific config key.
	 */
	async remove(key: string): Promise<boolean> {
		const data = await this.getSection();
		if (key in data) {
			delete data[key];
			await this.saveSection(data);
			return true;
		}
		return false;
	}

	/**
	 * Check if a config key exists.
	 */
	async has(key: string): Promise<boolean> {
		const data = await this.getSection();
		return key in data;
	}

	/**
	 * Clear all config data for this scope.
	 */
	async clear(): Promise<void> {
		await this.saveSection({});
	}

	/**
	 * Get all keys in this config scope.
	 */
	async keys(): Promise<string[]> {
		const data = await this.getSection();
		return Object.keys(data);
	}

	// --------------------------------------------------------------------------
	// Utility
	// --------------------------------------------------------------------------

	/**
	 * Get the resolved config key (for debugging).
	 * Async because library UUID mode requires file system access.
	 */
	async getResolvedKey(): Promise<string | null> {
		return this.getConfigKey();
	}

	/**
	 * Get the config file path (for debugging).
	 */
	getFilePath(): string {
		return this.getConfigFilePath();
	}
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a global config (shared across all plugins and libraries).
 */
export function createGlobalConfig(): EagleUserConfig {
	return new EagleUserConfig({ type: 'global' });
}

/**
 * Create a per-plugin global config.
 */
export function createPluginGlobalConfig(): EagleUserConfig {
	return new EagleUserConfig({ type: 'global', thisPluginOnly: true });
}

/**
 * Create a per-plugin config.
 */
export function createPluginConfig(): EagleUserConfig {
	return new EagleUserConfig({ type: 'pluginbased' });
}

/**
 * Create a per-library config (shared across plugins for the same library).
 */
export function createLibraryConfig(
	options: { useLibraryName?: boolean } = {}
): EagleUserConfig {
	return new EagleUserConfig({
		type: 'librarybased',
		useLibraryNameAsLibIdentifier: options.useLibraryName ?? false,
	});
}

/**
 * Create a per-library, per-plugin config.
 */
export function createLibraryPluginConfig(
	options: { useLibraryName?: boolean } = {}
): EagleUserConfig {
	return new EagleUserConfig({
		type: 'librarybased',
		thisPluginOnly: true,
		useLibraryNameAsLibIdentifier: options.useLibraryName ?? false,
	});
}

/**
 * Create a per-library config using persistent UUID.
 * The UUID is stored in `cooler-uuid.json` in the library folder.
 * This ensures config persists even if the library is moved/renamed.
 */
export function createLibraryUuidConfig(): EagleUserConfig {
	return new EagleUserConfig({
		type: 'librarybased',
		useLibraryUuid: true,
	});
}

/**
 * Create a per-library, per-plugin config using persistent UUID.
 * The UUID is stored in `cooler-uuid.json` in the library folder.
 * This ensures config persists even if the library is moved/renamed.
 */
export function createLibraryUuidPluginConfig(): EagleUserConfig {
	return new EagleUserConfig({
		type: 'librarybased',
		thisPluginOnly: true,
		useLibraryUuid: true,
	});
}

// ============================================================================
// Exports
// ============================================================================

export {
	getConfigBasePath,
	sha256,
	getOrCreateLibraryUuid,
	readLibraryUuid,
	writeLibraryUuid,
	LIBRARY_UUID_FILENAME,
};
