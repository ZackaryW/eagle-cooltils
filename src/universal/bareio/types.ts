export interface LibraryMetadata {
  folders: LibraryFolder[];
  smartFolders: SmartFolder[];
  quickAccess: QuickAccessEntry[];
  tagsGroups: TagGroup[];
  modificationTime: number;
  applicationVersion: string;
}

export interface LibraryFolder {
  id: string;
  name: string;
  description: string;
  children: LibraryFolder[];
  modificationTime: number;
  tags: string[];
  password: string;
  passwordTips: string;
}

export interface SmartFolderRule {
  property: string;
  method: string;
  value: unknown;
  [key: string]: unknown;
}

export interface SmartFolderCondition {
  rules: SmartFolderRule[];
  match?: 'AND' | 'OR' | string;
  boolean?: string;
  [key: string]: unknown;
}

export interface SmartFolder {
  id: string;
  name: string;
  description?: string;
  modificationTime?: number;
  conditions: SmartFolderCondition[];
  children?: SmartFolder[];
  icon?: string;
  parent?: string;
  imageCount?: number;
  [key: string]: unknown;
}

export interface TagGroup {
  id: string;
  name: string;
  tags: string[];
  color?: string;
  [key: string]: unknown;
}

export interface QuickAccessEntry {
  type: string;
  id: string;
  [key: string]: unknown;
}

export interface ItemMetadata {
  id: string;
  name: string;
  size: number;
  btime: number;
  mtime: number;
  ext: string;
  tags: string[];
  /** Folder IDs this item belongs to */
  folders: string[];
  isDeleted: boolean;
  url: string;
  annotation: string;
  modificationTime: number;
  lastModified: number;
  [key: string]: unknown;
}

export interface TagsIndex {
  historyTags: string[];
  starredTags: string[];
}

export interface MtimeIndex {
  [itemId: string]: number;
  all?: number;
}

export interface WriteItemOptions {
  updateIndexes?: boolean;
  syncUrlFile?: boolean;
}

export type UpdateMetadataFn = (metadata: LibraryMetadata) => LibraryMetadata;
