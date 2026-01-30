import { useState, useMemo, useEffect } from 'react';
import { EagleProvider, useEagle, filterItems, type FolderNode } from './hooks/useEagle';
import { FileExplorer, FilterBuilder, useFilterBuilder, ItemGrid, StatsBar } from './components';
import type { FilterableItem } from './hooks/useEagle';

// ============================================================================
// Main App Content
// ============================================================================

function AppContent() {
  const { items, loading, libraryName, selectedItems, selectedFolders } = useEagle();
  const [filter, setFilter] = useFilterBuilder();
  const [selectedFolder, setSelectedFolder] = useState<FolderNode | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Sync theme with Eagle
  useEffect(() => {
    try {
      const isDark = eagle.app.isDarkColors();
      setTheme(isDark ? 'dark' : 'light');
    } catch {
      // Not in Eagle environment
    }
  }, []);

  // Filter items based on folder and filter builder
  // Use JSON.stringify to ensure deep changes in filter trigger recalculation
  const filterKey = JSON.stringify(filter);
  const filteredItems = useMemo(() => {
    let result = items;

    // Filter by folder first
    if (selectedFolder) {
      result = result.filter(item => item.folders.includes(selectedFolder.id));
    }

    // Apply filter builder
    if (filter.conditions.length > 0) {
      result = filterItems(result as unknown as FilterableItem[], filter) as unknown as Item[];
    }

    return result;
  }, [items, selectedFolder, filterKey]);

  const handleFolderSelect = (folder: FolderNode | null) => {
    setSelectedFolder(folder);
  };

  return (
    <div data-theme={theme} className="flex h-screen bg-base-100 text-base-content">
      {/* Sidebar - File Explorer */}
      <aside className="w-64 flex-shrink-0 overflow-hidden">
        <FileExplorer
          onFolderSelect={handleFolderSelect}
          selectedFolderId={selectedFolder?.id}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-4 py-3 border-b border-base-300 flex items-center justify-between bg-base-100">
          <div>
            <h1 className="text-xl font-bold">Eagle Filter Explorer</h1>
            <p className="text-sm text-base-content/60">{libraryName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
          </div>
        </header>

        {/* Filter Builder */}
        <div className="p-4 border-b border-base-300">
          <FilterBuilder
            filter={filter}
            onChange={setFilter}
            resultCount={filteredItems.length}
          />
        </div>

        {/* Stats Bar */}
        <StatsBar
          total={items.length}
          filtered={filteredItems.length}
          selectedFolder={selectedFolder?.name}
          selectedItemCount={selectedItems.length}
          selectedFolderCount={selectedFolders.length}
        />

        {/* Item Grid */}
        <div className="flex-1 overflow-y-auto">
          <ItemGrid
            items={filteredItems}
            loading={loading}
            emptyMessage={
              filter.conditions.length > 0
                ? 'No items match your filter'
                : selectedFolder
                ? `No items in "${selectedFolder.name}"`
                : 'No items in library'
            }
          />
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// App Wrapper with Provider
// ============================================================================

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Wait for Eagle plugin to initialize
    if (typeof eagle !== 'undefined') {
      eagle.onPluginCreate(() => {
        setReady(true);
      });
    } else {
      // Development mode without Eagle
      console.warn('Eagle not available, running in dev mode');
      setReady(true);
    }
  }, []);

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <EagleProvider>
      <AppContent />
    </EagleProvider>
  );
}

export default App;
