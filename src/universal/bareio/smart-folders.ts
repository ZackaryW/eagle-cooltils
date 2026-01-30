import type { SmartFolder } from './types';
import { BareLibraryCore } from './core';

export class BareSmartFolders {
  constructor(public readonly library: BareLibraryCore) {}

  async listTree(): Promise<SmartFolder[]> {
    const meta = await this.library.readLibraryMetadata();
    return meta.smartFolders;
  }

  async getById(id: string): Promise<SmartFolder | undefined> {
    const meta = await this.library.readLibraryMetadata();
    return BareSmartFolders.findById(meta.smartFolders, id);
  }

  async add(folder: SmartFolder, parentId?: string): Promise<void> {
    await this.library.updateLibraryMetadata((meta) => {
      if (parentId) {
        const parent = BareSmartFolders.findById(meta.smartFolders, parentId);
        if (!parent) throw new Error(`Parent smart folder not found: ${parentId}`);
        parent.children = parent.children ?? [];
        parent.children.push(folder);
      } else {
        meta.smartFolders.push(folder);
      }
      return meta;
    });
  }

  async update(id: string, patch: Partial<SmartFolder>): Promise<void> {
    await this.library.updateLibraryMetadata((meta) => {
      const target = BareSmartFolders.findById(meta.smartFolders, id);
      if (!target) throw new Error(`Smart folder not found: ${id}`);
      Object.assign(target, patch);
      return meta;
    });
  }

  async remove(id: string): Promise<void> {
    await this.library.updateLibraryMetadata((meta) => {
      meta.smartFolders = BareSmartFolders.removeById(meta.smartFolders, id);
      return meta;
    });
  }

  private static findById(folders: SmartFolder[], id: string): SmartFolder | undefined {
    for (const folder of folders) {
      if (folder.id === id) return folder;
      const found = BareSmartFolders.findById(folder.children ?? [], id);
      if (found) return found;
    }
    return undefined;
  }

  private static removeById(folders: SmartFolder[], id: string): SmartFolder[] {
    return folders
      .filter((folder) => folder.id !== id)
      .map((folder) => ({
        ...folder,
        children: BareSmartFolders.removeById(folder.children ?? [], id),
      }));
  }
}
