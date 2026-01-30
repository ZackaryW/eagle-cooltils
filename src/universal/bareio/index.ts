import { BareLibrary } from './bare-library';
import { BareLibraryCore } from './core';
import { BareFolders } from './folders';
import { BareItem, BareItems } from './items';
import { BareQuickAccess } from './quick-access';
import { BareSmartFolders } from './smart-folders';
import { BareTagGroups } from './tags';

export { BareLibrary } from './bare-library';
export { BareLibraryCore } from './core';
export { BareItems, BareItem } from './items';
export { BareFolders } from './folders';
export { BareSmartFolders } from './smart-folders';
export { BareTagGroups } from './tags';
export { BareQuickAccess } from './quick-access';
export type {
  ItemMetadata,
  LibraryFolder,
  LibraryMetadata,
  SmartFolder,
  SmartFolderCondition,
  SmartFolderRule,
  TagGroup,
  QuickAccessEntry,
  MtimeIndex,
  TagsIndex,
  WriteItemOptions,
  UpdateMetadataFn,
} from './types';

export const bareio = {
  BareLibrary,
  BareLibraryCore,
  BareItems,
  BareItem,
  BareFolders,
  BareSmartFolders,
  BareTagGroups,
  BareQuickAccess,
};
