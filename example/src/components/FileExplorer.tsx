import { useState, useCallback } from 'react';
import { useFolderTree, useEagle, type FolderNode } from '../hooks/useEagle';

// Icons
const FolderIcon = ({ open, color }: { open?: boolean; color?: string }) => (
  <svg className={`w-5 h-5 ${color ? '' : 'text-warning'}`} fill="currentColor" viewBox="0 0 24 24" style={color ? { color } : undefined}>
    {open ? (
      <path d="M5 19h14c.55 0 1-.45 1-1V8c0-.55-.45-1-1-1h-5.59l-2.7-2.7A1 1 0 0 0 10 4H4c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h1z" />
    ) : (
      <path d="M4 4c-.55 0-1 .45-1 1v14c0 .55.45 1 1 1h16c.55 0 1-.45 1-1V8c0-.55-.45-1-1-1h-8.59l-2.7-2.7A1 1 0 0 0 8 4H4z" />
    )}
  </svg>
);

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

// Folder Tree Item
interface FolderTreeItemProps {
  node: FolderNode;
  selectedId: string | null;
  onSelect: (folder: FolderNode) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
}

function FolderTreeItem({ node, selectedId, onSelect, expandedIds, onToggleExpand }: FolderTreeItemProps) {
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.childNodes.length > 0;
  const isSelected = selectedId === node.id;

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer transition-all hover:bg-base-200 ${
          isSelected ? 'bg-primary/20 text-primary font-medium' : ''
        }`}
        style={{ paddingLeft: `${node.level * 16 + 8}px` }}
        onClick={() => onSelect(node)}
      >
        {hasChildren ? (
          <button
            className="btn btn-ghost btn-xs p-0 min-h-0 h-5 w-5"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.id);
            }}
          >
            <ChevronIcon expanded={isExpanded} />
          </button>
        ) : (
          <span className="w-5" />
        )}
        <FolderIcon open={isExpanded} color={node.iconColor} />
        <span className="flex-1 truncate text-sm">{node.name}</span>
        <span className="badge badge-ghost badge-sm">{node.itemCount}</span>
      </div>
      {isExpanded && hasChildren && (
        <div>
          {node.childNodes.map(child => (
            <FolderTreeItem
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Main File Explorer Component
interface FileExplorerProps {
  onFolderSelect?: (folder: FolderNode | null) => void;
  selectedFolderId?: string | null;
}

export function FileExplorer({ onFolderSelect, selectedFolderId }: FileExplorerProps) {
  const { libraryName, items, loading } = useEagle();
  const folderTree = useFolderTree();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);

  const selectedId = selectedFolderId ?? internalSelectedId;

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelect = useCallback((folder: FolderNode) => {
    setInternalSelectedId(folder.id);
    onFolderSelect?.(folder);
  }, [onFolderSelect]);

  const handleSelectAll = useCallback(() => {
    setInternalSelectedId(null);
    onFolderSelect?.(null);
  }, [onFolderSelect]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-base-100 border-r border-base-300">
      {/* Header */}
      <div className="px-4 py-3 border-b border-base-300">
        <h2 className="font-semibold text-lg truncate">{libraryName || 'Library'}</h2>
        <p className="text-xs text-base-content/60">{items.length} items</p>
      </div>

      {/* Folder Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* All Items */}
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all hover:bg-base-200 ${
            selectedId === null ? 'bg-primary/20 text-primary font-medium' : ''
          }`}
          onClick={handleSelectAll}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="flex-1 text-sm">All Items</span>
          <span className="badge badge-ghost badge-sm">{items.length}</span>
        </div>

        <div className="divider my-1 text-xs text-base-content/50">Folders</div>

        {/* Folder Tree */}
        {folderTree.map(node => (
          <FolderTreeItem
            key={node.id}
            node={node}
            selectedId={selectedId}
            onSelect={handleSelect}
            expandedIds={expandedIds}
            onToggleExpand={handleToggleExpand}
          />
        ))}
      </div>
    </div>
  );
}
