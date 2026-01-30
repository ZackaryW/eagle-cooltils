import { useMemo, useState } from 'react';

// ============================================================================
// Fallback Icon Component
// ============================================================================

function FileFallbackIcon() {
  return (
    <div className="flex items-center justify-center w-full h-full text-base-content/30">
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
  );
}

// ============================================================================
// Item Grid Component
// ============================================================================

interface ItemCardProps {
  item: Item;
  onClick?: (item: Item) => void;
  selected?: boolean;
}

function ItemCard({ item, onClick, selected }: ItemCardProps) {
  const [imgError, setImgError] = useState(false);
  
  const formattedSize = useMemo(() => {
    const bytes = item.size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, [item.size]);

  const starRating = item.star ?? 0;
  const hasDimensions = item.width > 0 && item.height > 0;
  const showThumbnail = item.thumbnailURL && !imgError;

  return (
    <div
      className={`card bg-base-100 shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden group ${
        selected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => onClick?.(item)}
    >
      {/* Thumbnail */}
      <figure className="relative h-32 bg-base-200 overflow-hidden">
        {showThumbnail ? (
          <img
            src={item.thumbnailURL}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <FileFallbackIcon />
        )}
        
        {/* Extension Badge */}
        <span className="absolute top-2 right-2 badge badge-sm badge-neutral uppercase">
          {item.ext}
        </span>

        {/* Deleted Overlay */}
        {item.isDeleted && (
          <div className="absolute inset-0 bg-error/50 flex items-center justify-center">
            <span className="badge badge-error">Deleted</span>
          </div>
        )}
      </figure>

      {/* Content */}
      <div className="card-body p-3">
        <h3 className="card-title text-sm truncate" title={item.name}>
          {item.name}
        </h3>
        
        <div className="flex items-center justify-between text-xs text-base-content/60">
          <span>{hasDimensions ? `${item.width}×${item.height}` : item.ext.toUpperCase()}</span>
          <span>{formattedSize}</span>
        </div>

        {/* Star Rating */}
        {starRating > 0 && (
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(star => (
              <svg
                key={star}
                className={`w-3 h-3 ${star <= starRating ? 'text-warning fill-warning' : 'text-base-300'}`}
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
        )}

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.tags.slice(0, 3).map(tag => (
              <span key={tag} className="badge badge-xs badge-outline">{tag}</span>
            ))}
            {item.tags.length > 3 && (
              <span className="badge badge-xs badge-ghost">+{item.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Grid Component
// ============================================================================

interface ItemGridProps {
  items: Item[];
  loading?: boolean;
  onItemClick?: (item: Item) => void;
  selectedItemId?: string | null;
  emptyMessage?: string;
}

export function ItemGrid({ items, loading, onItemClick, selectedItemId, emptyMessage = 'No items found' }: ItemGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-base-content/50">
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
      {items.map(item => (
        <ItemCard
          key={item.id}
          item={item}
          onClick={onItemClick}
          selected={item.id === selectedItemId}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Stats Bar Component
// ============================================================================

interface StatsBarProps {
  total: number;
  filtered: number;
  selectedFolder?: string | null;
  selectedItemCount?: number;
  selectedFolderCount?: number;
}

export function StatsBar({ total, filtered, selectedFolder, selectedItemCount = 0, selectedFolderCount = 0 }: StatsBarProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-base-200 text-sm border-b border-base-300">
      <div className="flex items-center gap-1">
        <span className="font-semibold">{filtered}</span>
        <span className="text-base-content/60">of {total} items</span>
      </div>
      {selectedFolder && (
        <div className="badge badge-outline badge-sm">
          Folder: {selectedFolder}
        </div>
      )}
      {/* Live selection from Eagle */}
      {selectedItemCount > 0 && (
        <div className="badge badge-primary badge-sm">
          {selectedItemCount} selected
        </div>
      )}
      {selectedFolderCount > 0 && (
        <div className="badge badge-secondary badge-sm">
          {selectedFolderCount} folder{selectedFolderCount > 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
}
