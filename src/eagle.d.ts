declare global {
  const eagle: {
    // event
    onPluginCreate(callback: (plugin: PluginContext) => void): void;
    onPluginRun(callback: () => void): void;
    onPluginBeforeExit(callback: () => void): void;
    onPluginShow(callback: () => void): void;
    onPluginHide(callback: () => void): void;
    onLibraryChanged(callback: (libraryPath: string) => void): void;
    onThemeChanged(callback: (theme: ThemeName) => void): void;

    // tag
    tag: {
      get(options?: { name?: string }): Promise<Tag[]>;
      getRecentTags(): Promise<Tag[]>;
      getStarredTags(): Promise<Tag[]>;
      merge(options: { source: string; target: string }): Promise<{
        affectedItems: number;
        sourceRemoved: boolean;
      }>;
    };

    // tagGroup
    tagGroup: {
      get(): Promise<TagGroup[]>;
      create(options: {
        name: string;
        color: TagGroupColor;
        tags: string[];
        description?: string;
      }): Promise<TagGroup>;
    };

    // library
    library: {
      info(): Promise<LibraryInfo>;
      readonly name: string;
      readonly path: string;
      readonly modificationTime: number;
    };

    // window
    window: {
      show(): Promise<void>;
      showInactive(): Promise<void>;
      hide(): Promise<void>;
      focus(): Promise<void>;
      minimize(): Promise<void>;
      isMinimized(): Promise<boolean>;
      restore(): Promise<void>;
      maximize(): Promise<void>;
      unmaximize(): Promise<void>;
      isMaximized(): Promise<boolean>;
      setFullScreen(flag: boolean): Promise<void>;
      isFullScreen(): Promise<boolean>;
      setAspectRatio(aspectRatio: number): Promise<void>;
      setBackgroundColor(backgroundColor: string): Promise<void>;
      setSize(width: number, height: number): Promise<void>;
      getSize(): Promise<[number, number]>;
      setBounds(bounds: Rectangle): Promise<void>;
      getBounds(): Promise<Rectangle>;
      setResizable(resizable: boolean): Promise<void>;
      isResizable(): Promise<boolean>;
      setAlwaysOnTop(flag: boolean): Promise<void>;
      isAlwaysOnTop(): Promise<boolean>;
      setPosition(x: number, y: number): Promise<void>;
      getPosition(): Promise<[number, number]>;
      setOpacity(opacity: number): Promise<void>;
      getOpacity(): Promise<number>;
      flashFrame(flag: boolean): Promise<void>;
      setIgnoreMouseEvents(ignore: boolean): Promise<void>;
      capturePage(rect?: Rectangle): Promise<NativeImage>;
      setReferer(url: string): void;
    };

    // app
    app: {
      isDarkColors(): boolean;
      getPath(name: AppPath): Promise<string>;
      getFileIcon(
        path: string,
        options?: { size: 'small' | 'normal' | 'large' }
      ): Promise<NativeImage>;
      createThumbnailFromPath(
        path: string,
        maxSize: Size
      ): Promise<NativeImage>;
      show(): Promise<boolean>;
      readonly version: string;
      readonly build: number;
      readonly locale:
        | 'en'
        | 'zh_CN'
        | 'zh_TW'
        | 'ja_JP'
        | 'ko_KR'
        | 'es_ES'
        | 'de_DE'
        | 'ru_RU';
      readonly arch: 'x64' | 'arm64' | 'x86';
      readonly platform: 'darwin' | 'win32';
      readonly env: { [key: string]: string };
      readonly execPath: string;
      readonly pid: number;
      readonly isWindows: boolean;
      readonly isMac: boolean;
      readonly runningUnderARM64Translation: boolean;
      readonly theme:
        | 'LIGHT'
        | 'LIGHTGRAY'
        | 'GRAY'
        | 'DARK'
        | 'BLUE'
        | 'PURPLE';
      readonly userDataPath: string;
    };

    // os
    os: {
      tmpdir(): string;
      version(): string;
      type(): 'Windows_NT' | 'Darwin';
      release(): string;
      hostname(): string;
      homedir(): string;
      arch(): 'x64' | 'arm64' | 'x86';
    };

    // screen
    screen: {
      getCursorScreenPoint(): Promise<Point>;
      getPrimaryDisplay(): Promise<Display>;
      getAllDisplays(): Promise<Display[]>;
      getDisplayNearestPoint(point: Point): Promise<Display>;
    };

    // notification
    notification: {
      show(options: {
        title: string;
        body: string;
        icon?: string;
        mute?: boolean;
        duration?: number;
      }): Promise<void>;
    };

    // item
    item: {
      get(options: ItemQueryOptions): Promise<Item[]>;
      getAll(): Promise<Item[]>;
      getById(itemId: string): Promise<Item>;
      getByIds(itemIds: string[]): Promise<Item[]>;
      getSelected(): Promise<Item[]>;
      getIdsWithModifiedAt(): Promise<Array<{ id: string; modifiedAt: number }>>;
      count(options: ItemCountOptions): Promise<number>;
      countAll(): Promise<number>;
      countSelected(): Promise<number>;
      select(itemIds: string[]): Promise<boolean>;
      addFromURL(
        url: string,
        options?: ItemAddOptions
      ): Promise<string>;
      addFromBase64(
        base64: string,
        options?: ItemAddOptions
      ): Promise<string>;
      addFromPath(
        path: string,
        options?: ItemAddOptions
      ): Promise<string>;
      addBookmark(
        url: string,
        options?: ItemAddBookmarkOptions
      ): Promise<string>;
      open(itemId: string, options?: { window?: boolean }): Promise<boolean>;
    };

    // folder
    folder: {
      create(options: {
        name: string;
        description?: string;
        parent?: string;
      }): Promise<Folder>;
      createSubfolder(
        parentId: string,
        options: {
          name: string;
          description?: string;
        }
      ): Promise<Folder>;
      get(options: {
        id?: string;
        ids?: string[];
        isSelected?: boolean;
        isRecent?: boolean;
      }): Promise<Folder[]>;
      getAll(): Promise<Folder[]>;
      getById(folderId: string): Promise<Folder>;
      getByIds(folderIds: string[]): Promise<Folder[]>;
      getSelected(): Promise<Folder[]>;
      getRecents(): Promise<Folder[]>;
      open(folderId: string): Promise<void>;
      IconColor: FolderIconColor;
    };

    // contextMenu
    contextMenu: {
      open(menuItems: MenuItem[]): Promise<void>;
    };

    // dialog
    dialog: {
      showOpenDialog(options: {
        title?: string;
        defaultPath?: string;
        buttonLabel?: string;
        filters?: FileFilter[];
        properties?: (
          | 'openFile'
          | 'openDirectory'
          | 'multiSelections'
          | 'showHiddenFiles'
          | 'createDirectory'
          | 'promptToCreate'
        )[];
        message?: string;
      }): Promise<{
        canceled: boolean;
        filePaths: string[];
      }>;
      showSaveDialog(options: {
        title?: string;
        defaultPath?: string;
        buttonLabel?: string;
        filters?: FileFilter[];
        properties?: (
          | 'openDirectory'
          | 'showHiddenFiles'
          | 'createDirectory'
        )[];
      }): Promise<{
        canceled: boolean;
        filePath?: string;
      }>;
      showMessageBox(options: {
        message: string;
        title?: string;
        detail?: string;
        buttons?: string[];
        type?: 'none' | 'info' | 'error' | 'question' | 'warning';
      }): Promise<{
        response: number;
      }>;
      showErrorBox(title: string, content: string): Promise<void>;
    };

    // clipboard
    clipboard: {
      clear(): void;
      has(format: string): boolean;
      writeText(text: string): void;
      readText(): Promise<string>;
      writeBuffer(format: string, buffer: Buffer): void;
      readBuffer(format: string): Buffer;
      writeImage(image: NativeImage): void;
      readImage(): NativeImage;
      writeHTML(markup: string): void;
      readHTML(): string;
      copyFiles(paths: string[]): void;
    };

    // drag
    drag: {
      startDrag(filePaths: string[]): Promise<void>;
    };

    // shell
    shell: {
      beep(): Promise<void>;
      openExternal(url: string): Promise<void>;
      openPath(path: string): Promise<void>;
      showItemInFolder(path: string): Promise<void>;
    };

    // log
    log: {
      info(obj: unknown): void;
      warn(obj: unknown): void;
      error(obj: unknown): void;
      debug(obj: unknown): void;
    };
  };

  interface Item {
    // Instance methods
    save(): Promise<boolean>;
    moveToTrash(): Promise<boolean>;
    replaceFile(filePath: string): Promise<boolean>;
    refreshThumbnail(): Promise<boolean>;
    setCustomThumbnail(thumbnailPath: string): Promise<boolean>;
    open(options?: { window?: boolean }): Promise<void>;
    select(): Promise<boolean>;

    // Instance properties
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
    readonly palettes: unknown[];
    readonly size: number;
    star: number;
    importedAt: number;
    readonly modifiedAt: number;
    readonly noThumbnail: boolean;
    readonly noPreview: boolean;
    readonly filePath: string;
    readonly fileURL: string;
    readonly thumbnailPath: string;
    readonly thumbnailURL: string;
    readonly metadataFilePath: string;
  }

  interface Folder {
    // Instance methods
    save(): Promise<void>;
    open(): Promise<void>;

    // Instance properties
    readonly id: string;
    name: string;
    description: string;
    readonly icon: string;
    iconColor: FolderIconColor[keyof FolderIconColor];
    readonly createdAt: number;
    parent: string | null;
    readonly children: Folder[];
  }

  interface Tag {
    id?: string;
    name: string;
    color?: string;
    readonly count?: number;
    readonly groups?: string[];
    readonly pinyin?: string;
    save(): Promise<boolean>;
  }

  interface TagGroup {
    // Instance methods
    save(): Promise<TagGroup>;
    remove(): Promise<boolean>;
    addTags(options: { tags: string[]; removeFromSource?: boolean }): Promise<TagGroup>;
    removeTags(options: { tags: string[] }): Promise<TagGroup>;

    // Instance properties
    name: string;
    color: TagGroupColor;
    tags: string[];
    description?: string;
  }
}

interface PluginContext {
  manifest: PluginManifest;
  path: string;
}

interface PluginManifest {
  name?: string;
  version?: string;
  logo?: string;
  [key: string]: unknown;
}

interface LibraryInfo {
  [key: string]: unknown;
}

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Size {
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

interface Display {
  [key: string]: unknown;
}

interface NativeImage {
  toDataURL(type?: string): string;
  toPNG(): Buffer;
  getSize(): Size;
}

interface FileFilter {
  name: string;
  extensions: string[];
}

interface MenuItem {
  id: string;
  label: string;
  submenu?: MenuItem[];
  click?: () => void;
}

type ThemeName =
  | 'Auto'
  | 'LIGHT'
  | 'LIGHTGRAY'
  | 'GRAY'
  | 'DARK'
  | 'BLUE'
  | 'PURPLE';

type TagGroupColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'aqua'
  | 'blue'
  | 'purple'
  | 'pink';

type ItemShape =
  | 'square'
  | 'portrait'
  | 'panoramic-portrait'
  | 'landscape'
  | 'panoramic-landscape';

type AppPath =
  | 'home'
  | 'appData'
  | 'userData'
  | 'temp'
  | 'exe'
  | 'desktop'
  | 'documents'
  | 'downloads'
  | 'music'
  | 'pictures'
  | 'videos'
  | 'recent';

type FolderIconColor = {
  Red: 'red';
  Orange: 'orange';
  Yellow: 'yellow';
  Green: 'green';
  Aqua: 'aqua';
  Blue: 'blue';
  Purple: 'purple';
  Pink: 'pink';
};

type ItemQueryOptions = {
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
  shape?: ItemShape;
  fields?: string[];
};

type ItemCountOptions = Omit<ItemQueryOptions, 'fields'>;

type ItemAddOptions = {
  name?: string;
  website?: string;
  tags?: string[];
  folders?: string[];
  annotation?: string;
};

type ItemAddBookmarkOptions = {
  name?: string;
  base64?: string;
  tags?: string[];
  folders?: string[];
  annotation?: string;
};

export {};