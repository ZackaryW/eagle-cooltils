/**
 * Universal utilities - cross-platform helpers
 * @module universal
 */

export { EagleWebApi } from './webapi';
export { BareLibrary, bareio } from './bareio';
export {
	ItemFilterBuilder,
	RuleBuilder,
	filterItems,
	matchesFilter,
	matchesCondition,
	matchesRule,
	filterByTags,
	filterByFolders,
	filterByName,
	filterByExtension,
	filterByRating,
	filterUntagged,
	filterUnfiled,
	filterByImportDate,
	combineFilters,
	anyOfFilters,
} from './filter';
export type {
	EagleWebApiOptions,
	EagleWebApiMethod,
	EagleWebApiListParams,
	EagleWebApiAddBookmarkParams,
	EagleWebApiAddFromUrlParams,
	EagleWebApiAddFromPathParams,
	EagleWebApiAddFromUrlsParams,
} from './webapi';
export type {
	LibraryMetadata,
	LibraryFolder,
	ItemMetadata,
	TagsIndex,
	MtimeIndex,
	SmartFolder,
	SmartFolderCondition,
	SmartFolderRule,
	TagGroup,
	QuickAccessEntry,
	WriteItemOptions,
} from './bareio';
export type {
	FilterMethod,
	FilterProperty,
	FilterRule,
	FilterCondition,
	ItemFilter,
	FilterableItem,
} from './filter';
export {
	EagleUserConfig,
	initEagleConfig,
	createGlobalConfig,
	createPluginGlobalConfig,
	createPluginConfig,
	createLibraryConfig,
	createLibraryPluginConfig,
	getConfigBasePath,
	sha256,
} from './config';
export type { ConfigType, EagleUserConfigOptions, ConfigData } from './config';
export {
	onLibraryChange,
	onItemChange,
	onFolderChange,
	onLibraryConfigChange,
	onLibraryFolderChange,
} from './subscribe';
export type {
	ChangeEvent,
	SubscribeOptions,
	Unsubscribe,
} from './subscribe';
