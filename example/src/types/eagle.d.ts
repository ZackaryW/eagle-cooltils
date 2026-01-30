// Eagle Plugin API type definitions
declare global {
  const eagle: {
    onPluginCreate(callback: (plugin: PluginContext) => void): void;
    onPluginRun(callback: () => void): void;
    onPluginBeforeExit(callback: () => void): void;
    onPluginShow(callback: () => void): void;
    onPluginHide(callback: () => void): void;
    onLibraryChanged(callback: (libraryPath: string) => void): void;
    onThemeChanged(callback: (theme: string) => void): void;

    item: {
      get(options: ItemQueryOptions): Promise<Item[]>;
      getAll(): Promise<Item[]>;
      getById(itemId: string): Promise<Item>;
      getByIds(itemIds: string[]): Promise<Item[]>;
      getSelected(): Promise<Item[]>;
      count(options?: Partial<ItemQueryOptions>): Promise<number>;
      countAll(): Promise<number>;
    };

    folder: {
      get(options: { id?: string; ids?: string[]; isSelected?: boolean }): Promise<Folder[]>;
      getAll(): Promise<Folder[]>;
      getById(folderId: string): Promise<Folder>;
      getByIds(folderIds: string[]): Promise<Folder[]>;
      getSelected(): Promise<Folder[]>;
      getRecents(): Promise<Folder[]>;
      open(folderId: string): Promise<void>;
    };

    library: {
      info(): Promise<LibraryInfo>;
      readonly name: string;
      readonly path: string;
    };

    app: {
      isDarkColors(): boolean;
      readonly theme: string;
    };
  };

  interface Item {
    readonly id: string;
    name: string;
    readonly ext: string;
    width: number;
    height: number;
    url: string;
    readonly isDeleted: boolean;
    annotation: string;
    tags: string[];
    folders: string[];
    readonly size: number;
    star?: number;
    importedAt: number;
    readonly modifiedAt: number;
    readonly filePath: string;
    readonly fileURL: string;
    readonly thumbnailPath: string;
    readonly thumbnailURL: string;
  }

  interface Folder {
    readonly id: string;
    name: string;
    description: string;
    readonly icon: string;
    iconColor: string;
    readonly createdAt: number;
    parent: string | null;
    readonly children: Folder[];
  }

  interface PluginContext {
    manifest: { name?: string; version?: string; [key: string]: unknown };
    path: string;
  }

  interface LibraryInfo {
    [key: string]: unknown;
  }

  interface ItemQueryOptions {
    id?: string;
    ids?: string[];
    isSelected?: boolean;
    isUntagged?: boolean;
    isUnfiled?: boolean;
    keywords?: string[];
    tags?: string[];
    folders?: string[];
    ext?: string;
    annotation?: string;
    rating?: number;
    url?: string;
  }
}

export {};
