import type { LibraryFolder } from './types';
import { BareLibraryCore } from './core';

export class BareFolders {
  constructor(public readonly library: BareLibraryCore) {}

  async listTree(): Promise<LibraryFolder[]> {
    const meta = await this.library.readLibraryMetadata();
    return meta.folders;
  }

  async getById(id: string): Promise<LibraryFolder | undefined> {
    const meta = await this.library.readLibraryMetadata();
    return BareFolders.findById(meta.folders, id);
  }

  async add(folder: LibraryFolder, parentId?: string): Promise<void> {
    await this.library.updateLibraryMetadata((meta) => {
      if (parentId) {
        const parent = BareFolders.findById(meta.folders, parentId);
        if (!parent) throw new Error(`Parent folder not found: ${parentId}`);
        parent.children = parent.children ?? [];
        parent.children.push(folder);
      } else {
        meta.folders.push(folder);
      }
      return meta;
    });
  }

  async update(id: string, patch: Partial<LibraryFolder>): Promise<void> {
    await this.library.updateLibraryMetadata((meta) => {
      const target = BareFolders.findById(meta.folders, id);
      if (!target) throw new Error(`Folder not found: ${id}`);
      Object.assign(target, patch);
      return meta;
    });
  }

  async remove(id: string): Promise<void> {
    await this.library.updateLibraryMetadata((meta) => {
      meta.folders = BareFolders.removeById(meta.folders, id);
      return meta;
    });
  }

  private static findById(folders: LibraryFolder[], id: string): LibraryFolder | undefined {
    for (const folder of folders) {
      if (folder.id === id) return folder;
      const found = BareFolders.findById(folder.children ?? [], id);
      if (found) return found;
    }
    return undefined;
  }

  private static removeById(folders: LibraryFolder[], id: string): LibraryFolder[] {
    return folders
      .filter((folder) => folder.id !== id)
      .map((folder) => ({
        ...folder,
        children: BareFolders.removeById(folder.children ?? [], id),
      }));
  }
}
