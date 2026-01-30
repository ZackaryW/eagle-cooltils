import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { ItemMetadata, WriteItemOptions } from './types';
import { BareLibraryCore } from './core';

export class BareItem {
  constructor(public readonly library: BareLibraryCore, readonly id: string) {}

  async read(): Promise<ItemMetadata> {
    return this.library.readJson<ItemMetadata>(this.library.itemMetadataPath(this.id));
  }

  async write(data: ItemMetadata, options: WriteItemOptions = {}): Promise<void> {
    await this.library.writeJson(this.library.itemMetadataPath(this.id), data);

    if (data.ext === 'url' && options.syncUrlFile !== false) {
      await this.writeUrlFile(data.url ?? '');
    }

    if (options.updateIndexes !== false) {
      await this.updateIndexes(data);
    }
  }

  get infoDir(): string {
    return this.library.itemInfoDir(this.id);
  }

  async readUrlFile(): Promise<string> {
    const entries = await fs.readdir(this.infoDir);
    const urlFile = entries.find((name) => name.toLowerCase().endsWith('.url'));
    if (!urlFile) throw new Error('URL file not found');
    const content = await fs.readFile(path.join(this.infoDir, urlFile), 'utf8');
    const match = content.match(/^URL=(.+)$/m);
    if (!match?.[1]) throw new Error('URL not found in .url file');
    return match[1].trim();
  }

  async writeUrlFile(url: string): Promise<void> {
    const entries = await fs.readdir(this.infoDir).catch(() => [] as string[]);
    const existing = entries.find((name) => name.toLowerCase().endsWith('.url'));
    const fileName = existing ?? `${this.id}.url`;
    const content = `[InternetShortcut]\nURL=${url}\n`;
    await fs.writeFile(path.join(this.infoDir, fileName), content, 'utf8');
  }

  private async updateIndexes(data: ItemMetadata): Promise<void> {
    const mtimeIndex = await this.library.readMtimeIndex();
    const ts = data.lastModified ?? data.modificationTime ?? Date.now();
    mtimeIndex[this.id] = ts;
    await this.library.writeMtimeIndex(mtimeIndex);

    if (data.tags?.length) {
      const tagsIndex = await this.library.readTagsIndex();
      const set = new Set(tagsIndex.historyTags ?? []);
      for (const tag of data.tags) set.add(tag);
      tagsIndex.historyTags = Array.from(set);
      tagsIndex.starredTags = tagsIndex.starredTags ?? [];
      await this.library.writeTagsIndex(tagsIndex);
    }
  }
}

export class BareItems {
  constructor(public readonly library: BareLibraryCore) {}

  item(id: string): BareItem {
    return new BareItem(this.library, id);
  }

  async listItemIds(): Promise<string[]> {
    return this.library.listItemIds();
  }

  async listItems(withMetadata: boolean = false): Promise<string[] | ItemMetadata[]> {
    const ids = await this.listItemIds();
    if (!withMetadata) return ids;
    const metas = await Promise.all(ids.map((id) => this.item(id).read()));
    return metas;
  }

  async readItemMetadata(id: string): Promise<ItemMetadata> {
    const data = await this.item(id).read();
    if (data.ext === 'url' && (!data.url || data.url.length === 0)) {
      const url = await this.item(id).readUrlFile().catch(() => undefined);
      if (url) data.url = url;
    }
    return data;
  }
}
