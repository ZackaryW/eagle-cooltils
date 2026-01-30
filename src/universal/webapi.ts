/**
 * Eagle Web API client (HTTP API)
 * Based on Eagle.cool Web API implementation patterns.
 */

export type EagleWebApiMethod = 'GET' | 'POST';

export interface EagleWebApiOptions {
  /** Base URL for Eagle API (default: http://localhost:41595) */
  baseUrl?: string;
  /** Static token value */
  token?: string;
  /** Token provider (preferred if token may change) */
  getToken?: () => string | undefined;
  /** Custom fetch implementation (defaults to global fetch) */
  fetch?: typeof fetch;
}

export interface EagleWebApiListParams extends Record<string, unknown> {
  limit?: number;
  offset?: number;
  orderBy?: string;
  /** Matches docs sample query param: name */
  name?: string;
  /** Back-compat alias for name */
  keyword?: string;
  ext?: string;
  tags?: string[];
  folders?: string[];
}

export interface EagleWebApiAddBookmarkParams {
  url: string;
  name: string;
  base64?: string;
  tags?: string[];
  modificationTime?: number;
  folderId?: string;
}

export interface EagleWebApiAddFromUrlParams {
  url: string;
  name: string;
  website?: string;
  tags?: string[];
  star?: number;
  annotation?: string;
  modificationTime?: number;
  folderId?: string;
  headers?: Record<string, string>;
}

export interface EagleWebApiAddFromPathParams {
  path: string;
  name: string;
  website?: string;
  annotation?: string;
  tags?: string[];
  folderId?: string;
}

export interface EagleWebApiAddFromUrlsParams {
  items: Array<Record<string, unknown>>;
  folderId?: string;
}

export class EagleWebApi {
  private readonly baseUrl: string;
  private readonly token: string | undefined;
  private readonly getToken: (() => string | undefined) | undefined;
  private readonly fetchImpl: typeof fetch;

  readonly application: InstanceType<typeof EagleWebApi.Application>;
  readonly folder: InstanceType<typeof EagleWebApi.Folder>;
  readonly library: InstanceType<typeof EagleWebApi.Library>;
  readonly item: InstanceType<typeof EagleWebApi.Item>;

  constructor(options: EagleWebApiOptions = {}) {
    this.baseUrl = options.baseUrl ?? 'http://localhost:41595';
    this.token = options.token;
    this.getToken = options.getToken;
    this.fetchImpl = options.fetch ?? fetch;

    this.application = new EagleWebApi.Application(this);
    this.folder = new EagleWebApi.Folder(this);
    this.library = new EagleWebApi.Library(this);
    this.item = new EagleWebApi.Item(this);
  }

  private resolveToken(): string {
    const token = this.getToken?.() ?? this.token;
    if (!token) {
      throw new Error('No API token found');
    }
    return token;
  }

  private static cleanObject<T extends Record<string, unknown> | undefined>(
    obj: T
  ): Record<string, unknown> | undefined {
    if (!obj) return undefined;
    const entries = Object.entries(obj).filter(([, value]) => value !== undefined && value !== null);
    return entries.length ? Object.fromEntries(entries) : undefined;
  }

  async request<T = unknown>(
    path: string,
    method: EagleWebApiMethod = 'GET',
    data?: Record<string, unknown>,
    params?: Record<string, unknown>
  ): Promise<T> {
    const token = this.resolveToken();
    const url = new URL(`${this.baseUrl.replace(/\/$/, '')}/api/${path}`);

    const cleanedParams = EagleWebApi.cleanObject({ ...(params ?? {}), token });
    if (cleanedParams) {
      for (const [key, value] of Object.entries(cleanedParams)) {
        if (Array.isArray(value)) {
          value.forEach((v) => url.searchParams.append(key, String(v)));
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const cleanedData = EagleWebApi.cleanObject(data);

    const init: RequestInit = { method };
    if (method === 'POST') {
      init.headers = { 'Content-Type': 'application/json' };
      init.body = JSON.stringify(cleanedData ?? {});
    }

    const response = await this.fetchImpl(url.toString(), init);

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Eagle API request failed: ${response.status} ${response.statusText} ${text}`);
    }

    const result = (await response.json()) as { data?: T };
    return result?.data as T;
  }

  static Application = class Application {
    constructor(public readonly client: EagleWebApi) {}

    info() {
      return this.client.request('application/info');
    }
  };

  static Folder = class Folder {
    constructor(public readonly client: EagleWebApi) {}

    create(name: string, parentId?: string) {
      return this.client.request('folder/create', 'POST', {
        folderName: name,
        parent: parentId,
      });
    }

    rename(folderId: string, newName: string) {
      return this.client.request('folder/rename', 'POST', {
        folderId,
        newName,
      });
    }

    update(folderId: string, newName?: string, newDescription?: string, newColor?: string) {
      return this.client.request('folder/update', 'POST', {
        folderId,
        newName,
        newDescription,
        newColor,
      });
    }

    list() {
      return this.client.request('folder/list');
    }

    listRecent() {
      return this.client.request('folder/listRecent');
    }
  };

  static Library = class Library {
    constructor(public readonly client: EagleWebApi) {}

    info() {
      return this.client.request('library/info');
    }

    history() {
      return this.client.request('library/history');
    }

    switch(libraryPath: string) {
      return this.client.request('library/switch', 'POST', {
        libraryPath,
      });
    }

    icon(libraryPath: string) {
      return this.client.request('library/icon', 'GET', undefined, {
        libraryPath,
      });
    }
  };

  static Item = class Item {
    constructor(public readonly client: EagleWebApi) {}

    update(itemId: string, tags?: string[], annotation?: string, url?: string, star?: number) {
      return this.client.request('item/update', 'POST', {
        id: itemId,
        tags,
        annotation,
        url,
        star,
      });
    }

    refreshThumbnail(itemId: string) {
      return this.client.request('item/refreshThumbnail', 'POST', { id: itemId });
    }

    refreshPalette(itemId: string) {
      return this.client.request('item/refreshPalette', 'POST', { id: itemId });
    }

    moveToTrash(itemIds: string[]) {
      return this.client.request('item/moveToTrash', 'POST', { itemIds });
    }

    list(params: EagleWebApiListParams = {}) {
      const { keyword, name, ...rest } = params;
      return this.client.request('item/list', 'GET', undefined, {
        ...rest,
        name: name ?? keyword,
      });
    }

    getThumbnail(itemId: string) {
      return this.client.request('item/thumbnail', 'GET', undefined, { id: itemId });
    }

    getInfo(itemId: string) {
      return this.client.request('item/info', 'GET', undefined, { id: itemId });
    }

    addBookmark(params: EagleWebApiAddBookmarkParams) {
      return this.client.request('item/addBookmark', 'POST', {
        url: params.url,
        name: params.name,
        base64: params.base64,
        tags: params.tags,
        modificationTime: params.modificationTime,
        folderId: params.folderId,
      });
    }

    addFromUrl(params: EagleWebApiAddFromUrlParams) {
      return this.client.request('item/addFromURL', 'POST', {
        url: params.url,
        name: params.name,
        website: params.website,
        tags: params.tags,
        star: params.star,
        annotation: params.annotation,
        modificationTime: params.modificationTime,
        folderId: params.folderId,
        headers: params.headers,
      });
    }

    addFromPath(params: EagleWebApiAddFromPathParams) {
      return this.client.request('item/addFromPath', 'POST', {
        path: params.path,
        name: params.name,
        website: params.website,
        annotation: params.annotation,
        tags: params.tags,
        folderId: params.folderId,
      });
    }

    addFromUrls(params: EagleWebApiAddFromUrlsParams) {
      return this.client.request('item/addFromURLs', 'POST', {
        items: params.items,
        folderId: params.folderId,
      });
    }
  };
}
