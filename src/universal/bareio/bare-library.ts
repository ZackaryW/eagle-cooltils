import { BareLibraryCore } from './core';
import { BareFolders } from './folders';
import { BareItems } from './items';
import { BareQuickAccess } from './quick-access';
import { BareSmartFolders } from './smart-folders';
import { BareTagGroups } from './tags';
import type { LibraryMetadata } from './types';

export class BareLibrary {
  readonly core: BareLibraryCore;
  readonly items: BareItems;
  readonly folders: BareFolders;
  readonly smartFolders: BareSmartFolders;
  readonly tagGroups: BareTagGroups;
  readonly quickAccess: BareQuickAccess;

  constructor(rootPath: string) {
    this.core = new BareLibraryCore(rootPath);
    this.items = new BareItems(this.core);
    this.folders = new BareFolders(this.core);
    this.smartFolders = new BareSmartFolders(this.core);
    this.tagGroups = new BareTagGroups(this.core);
    this.quickAccess = new BareQuickAccess(this.core);
  }

  async readLibraryMetadata() {
    return this.core.readLibraryMetadata();
  }

  async writeLibraryMetadata(metadata: LibraryMetadata) {
    await this.core.writeLibraryMetadata(metadata);
  }
}
