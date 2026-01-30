import { promises as fs } from 'node:fs';
import path from 'node:path';
import type {
  LibraryMetadata,
  MtimeIndex,
  TagsIndex,
  UpdateMetadataFn,
} from './types';

export class BareLibraryCore {
  readonly rootPath: string;

  constructor(rootPath: string) {
    this.rootPath = rootPath;
  }

  metadataPath(): string {
    return path.join(this.rootPath, 'metadata.json');
  }

  tagsPath(): string {
    return path.join(this.rootPath, 'tags.json');
  }

  mtimePath(): string {
    return path.join(this.rootPath, 'mtime.json');
  }

  imagesPath(): string {
    return path.join(this.rootPath, 'images');
  }

  itemInfoDir(id: string): string {
    return path.join(this.imagesPath(), `${id}.info`);
  }

  itemMetadataPath(id: string): string {
    return path.join(this.itemInfoDir(id), 'metadata.json');
  }

  async readLibraryMetadata(): Promise<LibraryMetadata> {
    return this.readJson<LibraryMetadata>(this.metadataPath());
  }

  async writeLibraryMetadata(metadata: LibraryMetadata): Promise<void> {
    await this.writeJson(this.metadataPath(), metadata);
  }

  async updateLibraryMetadata(update: UpdateMetadataFn): Promise<LibraryMetadata> {
    const current = await this.readLibraryMetadata();
    const next = update(structuredClone(current));
    await this.writeLibraryMetadata(next);
    return next;
  }

  async readTagsIndex(): Promise<TagsIndex> {
    return this.readJson<TagsIndex>(this.tagsPath());
  }

  async writeTagsIndex(index: TagsIndex): Promise<void> {
    await this.writeJson(this.tagsPath(), index);
  }

  async readMtimeIndex(): Promise<MtimeIndex> {
    return this.readJson<MtimeIndex>(this.mtimePath());
  }

  async writeMtimeIndex(index: MtimeIndex): Promise<void> {
    await this.writeJson(this.mtimePath(), index);
  }

  async listItemIds(): Promise<string[]> {
    const entries = await fs.readdir(this.imagesPath(), { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && entry.name.endsWith('.info'))
      .map((entry) => entry.name.replace(/\.info$/, ''));
  }

  async readJson<T>(filePath: string): Promise<T> {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content) as T;
  }

  async writeJson(filePath: string, data: unknown): Promise<void> {
    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, content, 'utf8');
  }
}
