/**
 * Shared models for Eagle runtime objects.
 * These are plain object representations of Eagle's private-field classes.
 * Use these when you need to extract/serialize Eagle API objects.
 * @module
 */

// ============================================================================
// Item Models
// ============================================================================

/**
 * Plain object representation of Eagle Item.
 * Eagle's Item class uses private fields (#id, #name, etc.) with getters.
 * This interface represents the extracted/serializable form.
 */
export interface PlainItem {
  id: string;
  name: string;
  ext: string;
  width: number;
  height: number;
  url: string;
  isDeleted: boolean;
  annotation: string;
  tags: string[];
  folders: string[];
  palettes: unknown[];
  size: number;
  star: number | undefined;
  importedAt: number;
  modifiedAt: number;
  noThumbnail: boolean;
  noPreview: boolean;
  filePath: string;
  fileURL: string;
  thumbnailPath: string;
  thumbnailURL: string;
  metadataFilePath: string;
}

/**
 * Extract a plain object from an Eagle Item instance.
 * Handles private field getter access.
 */
export function extractItem(item: Item): PlainItem {
  return {
    id: item.id,
    name: item.name,
    ext: item.ext,
    width: item.width,
    height: item.height,
    url: item.url,
    isDeleted: item.isDeleted,
    annotation: item.annotation,
    tags: item.tags,
    folders: item.folders,
    palettes: item.palettes,
    size: item.size,
    star: item.star,
    importedAt: item.importedAt,
    modifiedAt: item.modifiedAt,
    noThumbnail: item.noThumbnail,
    noPreview: item.noPreview,
    filePath: item.filePath,
    fileURL: item.fileURL,
    thumbnailPath: item.thumbnailPath,
    thumbnailURL: item.thumbnailURL,
    metadataFilePath: item.metadataFilePath,
  };
}

// ============================================================================
// Folder Models
// ============================================================================

/**
 * Plain object representation of Eagle Folder.
 * Eagle's Folder class uses private fields with getters.
 */
export interface PlainFolder {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconColor: string;
  createdAt: number;
  parent: string | null;
  children: Folder[];
}

/**
 * Extract a plain object from an Eagle Folder instance.
 * Handles private field getter access.
 */
export function extractFolder(folder: Folder): PlainFolder {
  return {
    id: folder.id,
    name: folder.name,
    description: folder.description,
    icon: folder.icon,
    iconColor: folder.iconColor,
    createdAt: folder.createdAt,
    parent: folder.parent,
    children: folder.children,
  };
}

// ============================================================================
// Library State Models
// ============================================================================

/**
 * Current library state snapshot.
 */
export interface LibraryState {
  path: string;
  name: string;
}

/**
 * Library configuration state (for change detection).
 */
export interface ConfigState {
  /** metadata.json modification time in ms */
  mtime: number;
}

/**
 * Library folder structure state (for change detection).
 * Monitors the library root directory mtime to detect folder additions/removals.
 */
export interface LibraryFolderState {
  /** Library directory modification time in ms */
  mtime: number;
}

/**
 * Get current library state from Eagle API.
 */
export function getLibraryState(): LibraryState {
  try {
    return {
      path: eagle.library.path,
      name: eagle.library.name,
    };
  } catch {
    return { path: '', name: '' };
  }
}
