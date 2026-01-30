/**
 * Subscription system for Eagle state change detection.
 * Provides reactive callbacks when items, folders, or library state changes.
 * @module
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  type PlainItem,
  type PlainFolder,
  type LibraryState,
  type ConfigState,
  type LibraryFolderState,
  extractItem,
  extractFolder,
  getLibraryState,
} from './models';

// ============================================================================
// Types
// ============================================================================

export interface SubscribeOptions {
  /** Check interval in milliseconds (default: 500) */
  interval?: number;
  /** Maximum IDs to compare for equality. -1 = all (default: -1) */
  maxEqualLookups?: number;
}

export interface ChangeEvent<T> {
  /** Previous state */
  previous: T;
  /** Current state */
  current: T;
  /** Timestamp of change detection */
  timestamp: number;
}

export type Unsubscribe = () => void;

type Callback<T> = (event: ChangeEvent<T>) => void;

// Re-export model types for convenience
export type { LibraryState, ConfigState, LibraryFolderState } from './models';

// ============================================================================
// Subscription Manager (Singleton)
// ============================================================================

interface WatcherEntry<T> {
  callback: Callback<T>;
  interval: number;
  maxEqualLookups: number;
}

interface WatcherState<TCallback, TInternal> {
  entries: Set<WatcherEntry<TCallback>>;
  timerId: ReturnType<typeof setInterval> | null;
  previous: TInternal[] | null;
}

class SubscriptionManager {
  private static instance: SubscriptionManager | null = null;

  private libraryState: LibraryState | null = null;
  private libraryTimerId: ReturnType<typeof setInterval> | null = null;
  private libraryCallbacks = new Set<Callback<LibraryState>>();

  private itemWatchers: WatcherState<Item[], PlainItem> = { entries: new Set(), timerId: null, previous: null };
  private folderWatchers: WatcherState<Folder[], PlainFolder> = { entries: new Set(), timerId: null, previous: null };
  
  // Config uses a simpler state (single value, not array)
  private configPrevious: ConfigState | null = null;
  private configEntries = new Set<WatcherEntry<ConfigState>>();
  private configTimerId: ReturnType<typeof setInterval> | null = null;

  // Library folder structure change detection
  private libraryFolderPrevious: LibraryFolderState | null = null;
  private libraryFolderEntries = new Set<WatcherEntry<LibraryFolderState>>();
  private libraryFolderTimerId: ReturnType<typeof setInterval> | null = null;

  private constructor() {}

  static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager();
    }
    return SubscriptionManager.instance;
  }

  // --------------------------------------------------------------------------
  // Library Change (Parent Watcher - 1s fixed)
  // --------------------------------------------------------------------------

  subscribeLibrary(callback: Callback<LibraryState>): Unsubscribe {
    this.libraryCallbacks.add(callback);
    this.ensureLibraryWatcher();

    return () => {
      this.libraryCallbacks.delete(callback);
      this.maybeStopLibraryWatcher();
    };
  }

  private ensureLibraryWatcher(): void {
    if (this.libraryTimerId) return;

    // Initialize state
    this.libraryState = getLibraryState();

    this.libraryTimerId = setInterval(() => {
      this.checkLibraryChange();
    }, 1000);
  }

  private maybeStopLibraryWatcher(): void {
    // Only stop if no library callbacks AND no child watchers
    if (
      this.libraryCallbacks.size === 0 &&
      this.itemWatchers.entries.size === 0 &&
      this.folderWatchers.entries.size === 0 &&
      this.configEntries.size === 0 &&
      this.libraryFolderEntries.size === 0
    ) {
      if (this.libraryTimerId) {
        clearInterval(this.libraryTimerId);
        this.libraryTimerId = null;
      }
      this.libraryState = null;
    }
  }

  private checkLibraryChange(): void {
    const current = getLibraryState();
    const previous = this.libraryState;

    if (previous && current.path !== previous.path) {
      const event: ChangeEvent<LibraryState> = {
        previous,
        current,
        timestamp: Date.now(),
      };

      // Notify library subscribers
      this.libraryCallbacks.forEach(cb => {
        try {
          cb(event);
        } catch (e) {
          console.error('[eagle-cooltils] Library change callback error:', e);
        }
      });

      // Cascade: reset all child watchers
      this.resetChildWatchers();
    }

    this.libraryState = current;
  }

  private resetChildWatchers(): void {
    // Clear previous states to force re-evaluation
    this.itemWatchers.previous = null;
    this.folderWatchers.previous = null;
    this.configPrevious = null;
    this.libraryFolderPrevious = null;
  }

  // --------------------------------------------------------------------------
  // Item Selection Change
  // --------------------------------------------------------------------------

  subscribeItems(
    callback: Callback<Item[]>,
    options: SubscribeOptions = {}
  ): Unsubscribe {
    const entry: WatcherEntry<Item[]> = {
      callback,
      interval: options.interval ?? 500,
      maxEqualLookups: options.maxEqualLookups ?? -1,
    };

    this.itemWatchers.entries.add(entry);
    this.ensureLibraryWatcher();
    this.ensureItemWatcher();

    return () => {
      this.itemWatchers.entries.delete(entry);
      this.maybeStopItemWatcher();
      this.maybeStopLibraryWatcher();
    };
  }

  private ensureItemWatcher(): void {
    if (this.itemWatchers.timerId) return;

    // Find minimum interval
    const minInterval = this.getMinInterval(this.itemWatchers.entries);

    this.itemWatchers.timerId = setInterval(async () => {
      await this.checkItemChange();
    }, minInterval);

    // Initial check
    this.checkItemChange();
  }

  private maybeStopItemWatcher(): void {
    if (this.itemWatchers.entries.size === 0 && this.itemWatchers.timerId) {
      clearInterval(this.itemWatchers.timerId);
      this.itemWatchers.timerId = null;
      this.itemWatchers.previous = null;
    }
  }

  private async checkItemChange(): Promise<void> {
    try {
      const selected = await eagle.item.getSelected();
      // Use shared extractItem function (handles private fields)
      const current = selected.map(item => extractItem(item));

      const previous = this.itemWatchers.previous;

      if (previous !== null) {
        // Check each subscriber with their own maxEqualLookups
        this.itemWatchers.entries.forEach(entry => {
          const prevIds = previous.map(i => i.id);
          const currIds = current.map(i => i.id);

          if (this.hasSelectionChanged(prevIds, currIds, entry.maxEqualLookups)) {
            const event: ChangeEvent<Item[]> = {
              previous: previous as unknown as Item[],
              current: current as unknown as Item[],
              timestamp: Date.now(),
            };
            try {
              entry.callback(event);
            } catch (e) {
              console.error('[eagle-cooltils] Item change callback error:', e);
            }
          }
        });
      }

      this.itemWatchers.previous = current;
    } catch (e) {
      console.error('[eagle-cooltils] Item selection check error:', e);
    }
  }

  // --------------------------------------------------------------------------
  // Folder Selection Change
  // --------------------------------------------------------------------------

  subscribeFolders(
    callback: Callback<Folder[]>,
    options: SubscribeOptions = {}
  ): Unsubscribe {
    const entry: WatcherEntry<Folder[]> = {
      callback,
      interval: options.interval ?? 500,
      maxEqualLookups: options.maxEqualLookups ?? -1,
    };

    this.folderWatchers.entries.add(entry);
    this.ensureLibraryWatcher();
    this.ensureFolderWatcher();

    return () => {
      this.folderWatchers.entries.delete(entry);
      this.maybeStopFolderWatcher();
      this.maybeStopLibraryWatcher();
    };
  }

  private ensureFolderWatcher(): void {
    if (this.folderWatchers.timerId) return;

    const minInterval = this.getMinInterval(this.folderWatchers.entries);

    this.folderWatchers.timerId = setInterval(async () => {
      await this.checkFolderChange();
    }, minInterval);

    this.checkFolderChange();
  }

  private maybeStopFolderWatcher(): void {
    if (this.folderWatchers.entries.size === 0 && this.folderWatchers.timerId) {
      clearInterval(this.folderWatchers.timerId);
      this.folderWatchers.timerId = null;
      this.folderWatchers.previous = null;
    }
  }

  private async checkFolderChange(): Promise<void> {
    try {
      const selected = await eagle.folder.getSelected();
      // Use shared extractFolder function (handles private fields)
      const current = selected.map(folder => extractFolder(folder));

      const previous = this.folderWatchers.previous;

      if (previous !== null) {
        this.folderWatchers.entries.forEach(entry => {
          const prevIds = previous.map(f => f.id);
          const currIds = current.map(f => f.id);

          if (this.hasSelectionChanged(prevIds, currIds, entry.maxEqualLookups)) {
            const event: ChangeEvent<Folder[]> = {
              previous: previous as unknown as Folder[],
              current: current as unknown as Folder[],
              timestamp: Date.now(),
            };
            try {
              entry.callback(event);
            } catch (e) {
              console.error('[eagle-cooltils] Folder change callback error:', e);
            }
          }
        });
      }

      this.folderWatchers.previous = current;
    } catch (e) {
      console.error('[eagle-cooltils] Folder selection check error:', e);
    }
  }

  // --------------------------------------------------------------------------
  // Library Config Change (mtime monitoring)
  // --------------------------------------------------------------------------

  subscribeConfig(
    callback: Callback<ConfigState>,
    options: Omit<SubscribeOptions, 'maxEqualLookups'> = {}
  ): Unsubscribe {
    const entry: WatcherEntry<ConfigState> = {
      callback,
      interval: options.interval ?? 500,
      maxEqualLookups: -1, // Not used for config
    };

    this.configEntries.add(entry);
    this.ensureLibraryWatcher();
    this.ensureConfigWatcher();

    return () => {
      this.configEntries.delete(entry);
      this.maybeStopConfigWatcher();
      this.maybeStopLibraryWatcher();
    };
  }

  private ensureConfigWatcher(): void {
    if (this.configTimerId) return;

    const minInterval = this.getMinInterval(this.configEntries);

    this.configTimerId = setInterval(async () => {
      await this.checkConfigChange();
    }, minInterval);

    this.checkConfigChange();
  }

  private maybeStopConfigWatcher(): void {
    if (this.configEntries.size === 0 && this.configTimerId) {
      clearInterval(this.configTimerId);
      this.configTimerId = null;
      this.configPrevious = null;
    }
  }

  private async checkConfigChange(): Promise<void> {
    try {
      const libraryPath = eagle.library.path;
      const metadataPath = path.join(libraryPath, 'metadata.json');

      const stats = await fs.stat(metadataPath);
      const current: ConfigState = { mtime: stats.mtimeMs };

      const previous = this.configPrevious;

      if (previous !== null && current.mtime !== previous.mtime) {
        const event: ChangeEvent<ConfigState> = {
          previous,
          current,
          timestamp: Date.now(),
        };

        this.configEntries.forEach(entry => {
          try {
            entry.callback(event);
          } catch (e) {
            console.error('[eagle-cooltils] Config change callback error:', e);
          }
        });
      }

      this.configPrevious = current;
    } catch (e) {
      // File might not exist or be inaccessible
      console.error('[eagle-cooltils] Config mtime check error:', e);
    }
  }

  // --------------------------------------------------------------------------
  // Library Folder Structure Change (directory mtime monitoring)
  // --------------------------------------------------------------------------

  subscribeLibraryFolders(
    callback: Callback<LibraryFolderState>,
    options: Omit<SubscribeOptions, 'maxEqualLookups'> = {}
  ): Unsubscribe {
    const entry: WatcherEntry<LibraryFolderState> = {
      callback,
      interval: options.interval ?? 500,
      maxEqualLookups: -1, // Not used
    };

    this.libraryFolderEntries.add(entry);
    this.ensureLibraryWatcher();
    this.ensureLibraryFolderWatcher();

    return () => {
      this.libraryFolderEntries.delete(entry);
      this.maybeStopLibraryFolderWatcher();
      this.maybeStopLibraryWatcher();
    };
  }

  private ensureLibraryFolderWatcher(): void {
    if (this.libraryFolderTimerId) return;

    const minInterval = this.getMinInterval(this.libraryFolderEntries);

    this.libraryFolderTimerId = setInterval(async () => {
      await this.checkLibraryFolderChange();
    }, minInterval);

    this.checkLibraryFolderChange();
  }

  private maybeStopLibraryFolderWatcher(): void {
    if (this.libraryFolderEntries.size === 0 && this.libraryFolderTimerId) {
      clearInterval(this.libraryFolderTimerId);
      this.libraryFolderTimerId = null;
      this.libraryFolderPrevious = null;
    }
  }

  private async checkLibraryFolderChange(): Promise<void> {
    try {
      const libraryPath = eagle.library.path;

      const stats = await fs.stat(libraryPath);
      const current: LibraryFolderState = { mtime: stats.mtimeMs };

      const previous = this.libraryFolderPrevious;

      if (previous !== null && current.mtime !== previous.mtime) {
        const event: ChangeEvent<LibraryFolderState> = {
          previous,
          current,
          timestamp: Date.now(),
        };

        this.libraryFolderEntries.forEach(entry => {
          try {
            entry.callback(event);
          } catch (e) {
            console.error('[eagle-cooltils] Library folder change callback error:', e);
          }
        });
      }

      this.libraryFolderPrevious = current;
    } catch (e) {
      console.error('[eagle-cooltils] Library folder mtime check error:', e);
    }
  }

  // --------------------------------------------------------------------------
  // Utilities
  // --------------------------------------------------------------------------

  private getMinInterval<T>(entries: Set<WatcherEntry<T>>): number {
    let min = 500;
    entries.forEach(e => {
      if (e.interval < min) min = e.interval;
    });
    return min;
  }

  private hasSelectionChanged(
    prev: string[],
    curr: string[],
    maxLookups: number
  ): boolean {
    if (prev.length !== curr.length) return true;

    const limit = maxLookups === -1 ? prev.length : Math.min(maxLookups, prev.length);

    for (let i = 0; i < limit; i++) {
      if (prev[i] !== curr[i]) return true;
    }

    return false;
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Subscribe to library path changes.
 * Fixed 1s interval. Triggers cascade reset of all other subscribers.
 *
 * @example
 * ```ts
 * const unsubscribe = onLibraryChange((event) => {
 *   console.log('Library changed from', event.previous.path, 'to', event.current.path);
 * });
 *
 * // Later: cleanup
 * unsubscribe();
 * ```
 */
export function onLibraryChange(
  callback: (event: ChangeEvent<LibraryState>) => void
): Unsubscribe {
  return SubscriptionManager.getInstance().subscribeLibrary(callback);
}

/**
 * Subscribe to item selection changes.
 *
 * @param callback - Called when selected items change
 * @param options.interval - Check interval in ms (default: 500)
 * @param options.maxEqualLookups - Max IDs to compare, -1 for all (default: -1)
 *
 * @example
 * ```ts
 * const unsubscribe = onItemChange((event) => {
 *   console.log('Selection changed:', event.current.length, 'items');
 * }, { interval: 200, maxEqualLookups: 10 });
 * ```
 */
export function onItemChange(
  callback: (event: ChangeEvent<Item[]>) => void,
  options?: SubscribeOptions
): Unsubscribe {
  return SubscriptionManager.getInstance().subscribeItems(callback, options);
}

/**
 * Subscribe to folder selection changes.
 *
 * @param callback - Called when selected folders change
 * @param options.interval - Check interval in ms (default: 500)
 * @param options.maxEqualLookups - Max IDs to compare, -1 for all (default: -1)
 *
 * @example
 * ```ts
 * const unsubscribe = onFolderChange((event) => {
 *   console.log('Folder selection changed');
 * });
 * ```
 */
export function onFolderChange(
  callback: (event: ChangeEvent<Folder[]>) => void,
  options?: SubscribeOptions
): Unsubscribe {
  return SubscriptionManager.getInstance().subscribeFolders(callback, options);
}

/**
 * Subscribe to library configuration changes.
 * Monitors metadata.json file mtime via bareio.
 *
 * @param callback - Called when library metadata file changes
 * @param options.interval - Check interval in ms (default: 500)
 *
 * @example
 * ```ts
 * const unsubscribe = onLibraryConfigChange((event) => {
 *   console.log('Library config updated at', event.current.mtime);
 * });
 * ```
 */
export function onLibraryConfigChange(
  callback: (event: ChangeEvent<ConfigState>) => void,
  options?: Omit<SubscribeOptions, 'maxEqualLookups'>
): Unsubscribe {
  return SubscriptionManager.getInstance().subscribeConfig(callback, options);
}

/**
 * Subscribe to library folder structure changes.
 * Monitors the library directory mtime to detect folder additions/removals.
 *
 * @param callback - Called when library folder structure changes
 * @param options.interval - Check interval in ms (default: 500)
 *
 * @example
 * ```ts
 * const unsubscribe = onLibraryFolderChange((event) => {
 *   console.log('Library folders updated at', event.current.mtime);
 *   // Refresh folder list from Eagle API
 * });
 * ```
 */
export function onLibraryFolderChange(
  callback: (event: ChangeEvent<LibraryFolderState>) => void,
  options?: Omit<SubscribeOptions, 'maxEqualLookups'>
): Unsubscribe {
  return SubscriptionManager.getInstance().subscribeLibraryFolders(callback, options);
}
