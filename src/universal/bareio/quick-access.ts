import type { QuickAccessEntry } from './types';
import { BareLibraryCore } from './core';

export class BareQuickAccess {
  constructor(public readonly library: BareLibraryCore) {}

  async list(): Promise<QuickAccessEntry[]> {
    const meta = await this.library.readLibraryMetadata();
    return meta.quickAccess;
  }

  async set(entries: QuickAccessEntry[]): Promise<void> {
    await this.library.updateLibraryMetadata((meta) => {
      meta.quickAccess = entries;
      return meta;
    });
  }

  async add(entry: QuickAccessEntry): Promise<void> {
    await this.library.updateLibraryMetadata((meta) => {
      meta.quickAccess.push(entry);
      return meta;
    });
  }

  async remove(type: string, id: string): Promise<void> {
    await this.library.updateLibraryMetadata((meta) => {
      meta.quickAccess = meta.quickAccess.filter((entry) => !(entry.type === type && entry.id === id));
      return meta;
    });
  }
}
