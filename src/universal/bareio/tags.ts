import type { TagGroup } from './types';
import { BareLibraryCore } from './core';

export class BareTagGroups {
  constructor(public readonly library: BareLibraryCore) {}

  async list(): Promise<TagGroup[]> {
    const meta = await this.library.readLibraryMetadata();
    return meta.tagsGroups;
  }

  async getById(id: string): Promise<TagGroup | undefined> {
    const meta = await this.library.readLibraryMetadata();
    return meta.tagsGroups.find((group) => group.id === id);
  }

  async add(group: TagGroup): Promise<void> {
    await this.library.updateLibraryMetadata((meta) => {
      meta.tagsGroups.push(group);
      return meta;
    });
  }

  async update(id: string, patch: Partial<TagGroup>): Promise<void> {
    await this.library.updateLibraryMetadata((meta) => {
      const group = meta.tagsGroups.find((g) => g.id === id);
      if (!group) throw new Error(`Tag group not found: ${id}`);
      Object.assign(group, patch);
      return meta;
    });
  }

  async remove(id: string): Promise<void> {
    await this.library.updateLibraryMetadata((meta) => {
      meta.tagsGroups = meta.tagsGroups.filter((g) => g.id !== id);
      return meta;
    });
  }

  async addTag(id: string, tag: string): Promise<void> {
    await this.library.updateLibraryMetadata((meta) => {
      const group = meta.tagsGroups.find((g) => g.id === id);
      if (!group) throw new Error(`Tag group not found: ${id}`);
      group.tags = Array.from(new Set([...(group.tags ?? []), tag]));
      return meta;
    });
  }

  async removeTag(id: string, tag: string): Promise<void> {
    await this.library.updateLibraryMetadata((meta) => {
      const group = meta.tagsGroups.find((g) => g.id === id);
      if (!group) throw new Error(`Tag group not found: ${id}`);
      group.tags = (group.tags ?? []).filter((t) => t !== tag);
      return meta;
    });
  }
}
