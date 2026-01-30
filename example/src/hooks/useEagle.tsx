import { useState, useEffect, useCallback, createContext, useContext } from 'react';

// Import eagle-cooltils (will be bundled inline by Vite)
import {
  ItemFilterBuilder as EagleItemFilterBuilder,
  filterItems as eagleFilterItems,
  filterByTags as eagleFilterByTags,
  filterByFolders as eagleFilterByFolders,
  filterByName as eagleFilterByName,
  filterByExtension as eagleFilterByExtension,
  filterByRating as eagleFilterByRating,
  filterUntagged as eagleFilterUntagged,
  filterUnfiled as eagleFilterUnfiled,
  filterByImportDate as eagleFilterByImportDate,
  combineFilters as eagleCombineFilters,
  anyOfFilters as eagleAnyOfFilters,
  onItemChange as eagleOnItemChange,
  onFolderChange as eagleOnFolderChange,
  onLibraryFolderChange as eagleOnLibraryFolderChange,
  onLibraryChange as eagleOnLibraryChange,
  // Config system
  EagleUserConfig,
  initEagleConfig,
  createLibraryPluginConfig,
} from 'eagle-cooltils/universal';

// ============================================================================
// Filter Types (mirrored from eagle-cooltils for TypeScript compatibility)
// ============================================================================

export type FilterMethod =
  | 'is' | 'isNot' | 'contains' | 'notContains' | 'startsWith' | 'endsWith'
  | 'matches' | 'gt' | 'gte' | 'lt' | 'lte' | 'between'
  | 'isEmpty' | 'isNotEmpty' | 'includesAny' | 'includesAll' | 'excludesAny' | 'excludesAll';

export type FilterProperty =
  | 'id' | 'name' | 'ext' | 'url' | 'annotation' | 'tags' | 'folders'
  | 'star' | 'width' | 'height' | 'size' | 'importedAt' | 'modifiedAt' | 'isDeleted';

export interface FilterRule {
  property: FilterProperty;
  method: FilterMethod;
  value?: unknown;
}

export interface FilterCondition {
  rules: FilterRule[];
  match: 'AND' | 'OR';
}

export interface ItemFilter {
  conditions: FilterCondition[];
  match: 'AND' | 'OR';
}

export interface FilterableItem {
  readonly id: string;
  name: string;
  readonly ext: string;
  url: string;
  annotation: string;
  tags: string[];
  folders: string[];
  star?: number;
  width: number;
  height: number;
  readonly size: number;
  importedAt: number;
  readonly modifiedAt: number;
  readonly isDeleted: boolean;
  [key: string]: unknown;
}

// Change event type for subscriptions
interface ChangeEventType<T> {
  previous: T;
  current: T;
  timestamp: number;
}

interface RuleBuilderClass {
  is(value: unknown): ItemFilterBuilderClass;
  isNot(value: unknown): ItemFilterBuilderClass;
  contains(value: string): ItemFilterBuilderClass;
  notContains(value: string): ItemFilterBuilderClass;
  startsWith(value: string): ItemFilterBuilderClass;
  endsWith(value: string): ItemFilterBuilderClass;
  matches(regex: RegExp | string): ItemFilterBuilderClass;
  gt(value: number): ItemFilterBuilderClass;
  gte(value: number): ItemFilterBuilderClass;
  lt(value: number): ItemFilterBuilderClass;
  lte(value: number): ItemFilterBuilderClass;
  between(min: number, max: number): ItemFilterBuilderClass;
  includesAny(values: string[]): ItemFilterBuilderClass;
  includesAll(values: string[]): ItemFilterBuilderClass;
  excludesAny(values: string[]): ItemFilterBuilderClass;
  excludesAll(values: string[]): ItemFilterBuilderClass;
  isEmpty(): ItemFilterBuilderClass;
  isNotEmpty(): ItemFilterBuilderClass;
}

interface ItemFilterBuilderClass {
  where(property: FilterProperty): RuleBuilderClass;
  and(property: FilterProperty): RuleBuilderClass;
  or(property: FilterProperty): RuleBuilderClass;
  addCondition(condition: FilterCondition): ItemFilterBuilderClass;
  setConditionMatch(match: 'AND' | 'OR'): ItemFilterBuilderClass;
  build(): ItemFilter;
}

// Re-export utilities
export const ItemFilterBuilder = EagleItemFilterBuilder;
export const filterItems = eagleFilterItems;
export const filterByTags = eagleFilterByTags;
export const filterByFolders = eagleFilterByFolders;
export const filterByName = eagleFilterByName;
export const filterByExtension = eagleFilterByExtension;
export const filterByRating = eagleFilterByRating;
export const filterUntagged = eagleFilterUntagged;
export const filterUnfiled = eagleFilterUnfiled;
export const filterByImportDate = eagleFilterByImportDate;
export const combineFilters = eagleCombineFilters;
export const anyOfFilters = eagleAnyOfFilters;

// Subscription exports
export const onItemChange = eagleOnItemChange;
export const onFolderChange = eagleOnFolderChange;
export const onLibraryFolderChange = eagleOnLibraryFolderChange;
export const onLibraryChange = eagleOnLibraryChange;

// ============================================================================
// Eagle Context
// ============================================================================

interface EagleState {
  items: Item[];
  folders: Folder[];
  loading: boolean;
  error: string | null;
  libraryName: string;
  libraryPath: string;
  selectedItems: Item[];
  selectedFolders: Folder[];
}

interface EagleContextValue extends EagleState {
  refresh: () => Promise<void>;
  refreshFolders: () => Promise<void>;
  getItemsByFolder: (folderId: string) => Item[];
}

const EagleContext = createContext<EagleContextValue | null>(null);

export function useEagle() {
  const ctx = useContext(EagleContext);
  if (!ctx) throw new Error('useEagle must be used within EagleProvider');
  return ctx;
}

export function EagleProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<EagleState>({
    items: [],
    folders: [],
    loading: true,
    error: null,
    libraryName: '',
    libraryPath: '',
    selectedItems: [],
    selectedFolders: [],
  });

  const refresh = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const [items, folders] = await Promise.all([
        eagle.item.getAll(),
        eagle.folder.getAll(),
      ]);
      setState(s => ({
        ...s,
        items,
        folders,
        loading: false,
        libraryName: eagle.library.name,
        libraryPath: eagle.library.path,
      }));
    } catch (err) {
      setState(s => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  }, []);

  // Refresh only folders (lightweight)
  const refreshFolders = useCallback(async () => {
    try {
      const folders = await eagle.folder.getAll();
      setState(s => ({ ...s, folders }));
    } catch (err) {
      console.error('[EagleProvider] Failed to refresh folders:', err);
    }
  }, []);

  const getItemsByFolder = useCallback((folderId: string) => {
    return state.items.filter(item => item.folders.includes(folderId));
  }, [state.items]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Subscribe to live changes
  useEffect(() => {
    // Item selection changes
    const unsubItem = onItemChange((event) => {
      console.log('[EagleProvider] Item selection changed:', event.current.length, 'items');
      setState(s => ({ ...s, selectedItems: event.current }));
    }, { interval: 300 });

    // Folder selection changes
    const unsubFolder = onFolderChange((event) => {
      console.log('[EagleProvider] Folder selection changed:', event.current.length, 'folders');
      setState(s => ({ ...s, selectedFolders: event.current }));
    }, { interval: 300 });

    // Library folder structure changes (folders added/removed)
    const unsubLibraryFolder = onLibraryFolderChange(() => {
      console.log('[EagleProvider] Library folder structure changed, refreshing folders...');
      refreshFolders();
    }, { interval: 1000 });

    // Library switch
    const unsubLibrary = onLibraryChange((event) => {
      console.log('[EagleProvider] Library changed to:', event.current.name);
      refresh();
    });

    return () => {
      unsubItem();
      unsubFolder();
      unsubLibraryFolder();
      unsubLibrary();
    };
  }, [refresh, refreshFolders]);

  return (
    <EagleContext.Provider value={{ ...state, refresh, refreshFolders, getItemsByFolder }}>
      {children}
    </EagleContext.Provider>
  );
}

// ============================================================================
// Hook: useItems with filtering
// ============================================================================

export function useItems(filter?: ItemFilter) {
  const { items, loading } = useEagle();
  
  const filteredItems = filter 
    ? filterItems(items as unknown as FilterableItem[], filter) as unknown as Item[]
    : items;

  return { items: filteredItems, loading, total: items.length };
}

// ============================================================================
// Hook: useFolderTree
// ============================================================================

export interface FolderNode extends Folder {
  level: number;
  childNodes: FolderNode[];
  itemCount: number;
}

export function useFolderTree() {
  const { folders, getItemsByFolder } = useEagle();

  const buildTree = useCallback((parentId: string | null = null, level = 0): FolderNode[] => {
    return folders
      .filter(f => f.parent === parentId)
      .map(folder => ({
        // Extract folder properties explicitly (Eagle uses private fields with getters)
        id: folder.id,
        name: folder.name,
        description: folder.description,
        icon: folder.icon,
        iconColor: folder.iconColor,
        createdAt: folder.createdAt,
        parent: folder.parent,
        children: folder.children,
        // Bind methods if they exist
        save: (folder as Folder & { save?: () => Promise<void> }).save?.bind(folder) ?? (() => Promise.resolve()),
        open: (folder as Folder & { open?: () => Promise<void> }).open?.bind(folder) ?? (() => Promise.resolve()),
        // FolderNode extensions
        level,
        childNodes: buildTree(folder.id, level + 1),
        itemCount: getItemsByFolder(folder.id).length,
      }));
  }, [folders, getItemsByFolder]);

  return buildTree();
}

// ============================================================================
// Config Initialization
// ============================================================================

// Initialize config system on plugin create
eagle.onPluginCreate((plugin) => {
  initEagleConfig(plugin);
});

// ============================================================================
// Hook: useFilterPresets - Persist filter conditions
// ============================================================================

export interface FilterPreset {
  id: string;
  name: string;
  filter: ItemFilter;
  createdAt: number;
  updatedAt: number;
}

interface FilterPresetsState {
  presets: FilterPreset[];
  loading: boolean;
  error: string | null;
}

// Config instance for filter presets (per-library, per-plugin)
const filterPresetsConfig = createLibraryPluginConfig({ useLibraryName: false });

export function useFilterPresets() {
  const [state, setState] = useState<FilterPresetsState>({
    presets: [],
    loading: true,
    error: null,
  });

  // Load presets on mount
  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const presets = await filterPresetsConfig.getOrDefault<FilterPreset[]>('presets', []);
      setState({ presets, loading: false, error: null });
    } catch (err) {
      setState(s => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load presets',
      }));
    }
  }, []);

  const savePreset = useCallback(async (name: string, filter: ItemFilter): Promise<FilterPreset> => {
    const now = Date.now();
    const preset: FilterPreset = {
      id: `preset_${now}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      filter,
      createdAt: now,
      updatedAt: now,
    };

    const newPresets = [...state.presets, preset];
    await filterPresetsConfig.set('presets', newPresets);
    setState(s => ({ ...s, presets: newPresets }));
    return preset;
  }, [state.presets]);

  const updatePreset = useCallback(async (id: string, updates: Partial<Pick<FilterPreset, 'name' | 'filter'>>): Promise<void> => {
    const newPresets = state.presets.map(p => {
      if (p.id !== id) return p;
      return {
        ...p,
        ...updates,
        updatedAt: Date.now(),
      };
    });
    await filterPresetsConfig.set('presets', newPresets);
    setState(s => ({ ...s, presets: newPresets }));
  }, [state.presets]);

  const deletePreset = useCallback(async (id: string): Promise<void> => {
    const newPresets = state.presets.filter(p => p.id !== id);
    await filterPresetsConfig.set('presets', newPresets);
    setState(s => ({ ...s, presets: newPresets }));
  }, [state.presets]);

  const getPreset = useCallback((id: string): FilterPreset | undefined => {
    return state.presets.find(p => p.id === id);
  }, [state.presets]);

  return {
    presets: state.presets,
    loading: state.loading,
    error: state.error,
    savePreset,
    updatePreset,
    deletePreset,
    getPreset,
    refresh: loadPresets,
  };
}

// ============================================================================
// Hook: useLastFilter - Remember last used filter for this library
// ============================================================================

export function useLastFilter() {
  const [lastFilter, setLastFilterState] = useState<ItemFilter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLastFilter();
  }, []);

  const loadLastFilter = async () => {
    setLoading(true);
    try {
      const filter = await filterPresetsConfig.get<ItemFilter>('lastFilter');
      setLastFilterState(filter ?? null);
    } catch (err) {
      console.error('[useLastFilter] Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  const setLastFilter = useCallback(async (filter: ItemFilter | null) => {
    try {
      if (filter && filter.conditions.length > 0) {
        await filterPresetsConfig.set('lastFilter', filter);
      } else {
        await filterPresetsConfig.remove('lastFilter');
      }
      setLastFilterState(filter);
    } catch (err) {
      console.error('[useLastFilter] Failed to save:', err);
    }
  }, []);

  return { lastFilter, setLastFilter, loading };
}
