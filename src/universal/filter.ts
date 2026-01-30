/**
 * Item filtering utilities for Eagle items
 * Uses a condition-based approach similar to Smart Folders
 * @module universal/filter
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Comparison methods for filter rules
 */
export type FilterMethod =
	| 'is'
	| 'isNot'
	| 'contains'
	| 'notContains'
	| 'startsWith'
	| 'endsWith'
	| 'matches' // regex
	| 'gt'
	| 'gte'
	| 'lt'
	| 'lte'
	| 'between'
	| 'isEmpty'
	| 'isNotEmpty'
	| 'includesAny'
	| 'includesAll'
	| 'excludesAny'
	| 'excludesAll';

/**
 * Properties available for filtering
 */
export type FilterProperty =
	| 'id'
	| 'name'
	| 'ext'
	| 'url'
	| 'annotation'
	| 'tags'
	| 'folders'
	| 'star'
	| 'width'
	| 'height'
	| 'size'
	| 'importedAt'
	| 'modifiedAt'
	| 'isDeleted';

/**
 * A single filter rule
 */
export interface FilterRule {
	/** Property to filter on */
	property: FilterProperty;
	/** Comparison method */
	method: FilterMethod;
	/** Value to compare against (type depends on property and method) */
	value?: unknown;
}

/**
 * A condition containing multiple rules
 */
export interface FilterCondition {
	/** Rules in this condition */
	rules: FilterRule[];
	/** How to combine rules: AND (all must match) or OR (any must match) */
	match: 'AND' | 'OR';
}

/**
 * Complete filter configuration
 */
export interface ItemFilter {
	/** Conditions to apply */
	conditions: FilterCondition[];
	/** How to combine conditions: AND (all must match) or OR (any must match) */
	match: 'AND' | 'OR';
}

/**
 * Minimal Item interface for filtering (compatible with Eagle's Item)
 */
export interface FilterableItem {
	readonly id: string;
	name: string;
	readonly ext: string;
	url: string;
	annotation: string;
	tags: string[];
	folders: string[];
	star: number;
	width: number;
	height: number;
	readonly size: number;
	importedAt: number;
	readonly modifiedAt: number;
	readonly isDeleted: boolean;
	[key: string]: unknown;
}

// ============================================================================
// Filter Builder (Fluent API)
// ============================================================================

/**
 * Fluent builder for creating item filters
 *
 * @example
 * ```ts
 * const filter = new ItemFilterBuilder()
 *   .where('tags').includesAny(['photo', 'image'])
 *   .and('ext').is('png')
 *   .or('name').matches(/wallpaper/i)
 *   .build();
 *
 * const filtered = filterItems(items, filter);
 * ```
 */
export class ItemFilterBuilder {
	private conditions: FilterCondition[] = [];
	private currentCondition: FilterCondition | null = null;
	private conditionMatch: 'AND' | 'OR' = 'AND';

	/**
	 * Start a new rule on a property
	 */
	where(property: FilterProperty): RuleBuilder {
		this.currentCondition = { rules: [], match: 'AND' };
		this.conditions.push(this.currentCondition);
		return new RuleBuilder(this, this.currentCondition, property);
	}

	/**
	 * Add another rule with AND logic in current condition
	 */
	and(property: FilterProperty): RuleBuilder {
		if (!this.currentCondition) {
			return this.where(property);
		}
		return new RuleBuilder(this, this.currentCondition, property);
	}

	/**
	 * Start a new condition with OR logic
	 */
	or(property: FilterProperty): RuleBuilder {
		this.conditionMatch = 'OR';
		this.currentCondition = { rules: [], match: 'AND' };
		this.conditions.push(this.currentCondition);
		return new RuleBuilder(this, this.currentCondition, property);
	}

	/**
	 * Add a complete condition
	 */
	addCondition(condition: FilterCondition): this {
		this.conditions.push(condition);
		this.currentCondition = condition;
		return this;
	}

	/**
	 * Set how conditions are combined
	 */
	setConditionMatch(match: 'AND' | 'OR'): this {
		this.conditionMatch = match;
		return this;
	}

	/**
	 * Build the final filter
	 */
	build(): ItemFilter {
		return {
			conditions: this.conditions,
			match: this.conditionMatch,
		};
	}
}

/**
 * Helper class for building individual rules
 */
export class RuleBuilder {
	constructor(
		private builder: ItemFilterBuilder,
		private condition: FilterCondition,
		private property: FilterProperty
	) {}

	private addRule(method: FilterMethod, value?: unknown): ItemFilterBuilder {
		this.condition.rules.push({ property: this.property, method, value });
		return this.builder;
	}

	// String/equality methods
	is(value: unknown): ItemFilterBuilder {
		return this.addRule('is', value);
	}
	isNot(value: unknown): ItemFilterBuilder {
		return this.addRule('isNot', value);
	}
	contains(value: string): ItemFilterBuilder {
		return this.addRule('contains', value);
	}
	notContains(value: string): ItemFilterBuilder {
		return this.addRule('notContains', value);
	}
	startsWith(value: string): ItemFilterBuilder {
		return this.addRule('startsWith', value);
	}
	endsWith(value: string): ItemFilterBuilder {
		return this.addRule('endsWith', value);
	}
	matches(regex: RegExp | string): ItemFilterBuilder {
		return this.addRule('matches', regex instanceof RegExp ? regex.source : regex);
	}

	// Numeric methods
	gt(value: number): ItemFilterBuilder {
		return this.addRule('gt', value);
	}
	gte(value: number): ItemFilterBuilder {
		return this.addRule('gte', value);
	}
	lt(value: number): ItemFilterBuilder {
		return this.addRule('lt', value);
	}
	lte(value: number): ItemFilterBuilder {
		return this.addRule('lte', value);
	}
	between(min: number, max: number): ItemFilterBuilder {
		return this.addRule('between', [min, max]);
	}

	// Array methods
	includesAny(values: string[]): ItemFilterBuilder {
		return this.addRule('includesAny', values);
	}
	includesAll(values: string[]): ItemFilterBuilder {
		return this.addRule('includesAll', values);
	}
	excludesAny(values: string[]): ItemFilterBuilder {
		return this.addRule('excludesAny', values);
	}
	excludesAll(values: string[]): ItemFilterBuilder {
		return this.addRule('excludesAll', values);
	}

	// Empty checks
	isEmpty(): ItemFilterBuilder {
		return this.addRule('isEmpty');
	}
	isNotEmpty(): ItemFilterBuilder {
		return this.addRule('isNotEmpty');
	}
}

// ============================================================================
// Filter Execution
// ============================================================================

/**
 * Filter items using the given filter configuration
 *
 * @param items - Items to filter
 * @param filter - Filter configuration
 * @returns Filtered items
 *
 * @example
 * ```ts
 * const items = await eagle.item.getAll();
 * const filter = new ItemFilterBuilder()
 *   .where('tags').includesAny(['favorite'])
 *   .and('star').gte(3)
 *   .build();
 * const favorites = filterItems(items, filter);
 * ```
 */
export function filterItems<T extends FilterableItem>(items: T[], filter: ItemFilter): T[] {
	return items.filter((item) => matchesFilter(item, filter));
}

/**
 * Check if a single item matches the filter
 */
export function matchesFilter(item: FilterableItem, filter: ItemFilter): boolean {
	if (filter.conditions.length === 0) return true;

	const results = filter.conditions.map((condition) => matchesCondition(item, condition));

	return filter.match === 'AND' ? results.every(Boolean) : results.some(Boolean);
}

/**
 * Check if an item matches a condition
 */
export function matchesCondition(item: FilterableItem, condition: FilterCondition): boolean {
	if (condition.rules.length === 0) return true;

	const results = condition.rules.map((rule) => matchesRule(item, rule));

	return condition.match === 'AND' ? results.every(Boolean) : results.some(Boolean);
}

/**
 * Check if an item matches a single rule
 */
export function matchesRule(item: FilterableItem, rule: FilterRule): boolean {
	const itemValue = item[rule.property];
	const ruleValue = rule.value;

	switch (rule.method) {
		case 'is':
			return itemValue === ruleValue;

		case 'isNot':
			return itemValue !== ruleValue;

		case 'contains':
			return typeof itemValue === 'string' && itemValue.includes(String(ruleValue));

		case 'notContains':
			return typeof itemValue === 'string' && !itemValue.includes(String(ruleValue));

		case 'startsWith':
			return typeof itemValue === 'string' && itemValue.startsWith(String(ruleValue));

		case 'endsWith':
			return typeof itemValue === 'string' && itemValue.endsWith(String(ruleValue));

		case 'matches': {
			if (typeof itemValue !== 'string') return false;
			const regex = new RegExp(String(ruleValue), 'i');
			return regex.test(itemValue);
		}

		case 'gt':
			return typeof itemValue === 'number' && itemValue > (ruleValue as number);

		case 'gte':
			return typeof itemValue === 'number' && itemValue >= (ruleValue as number);

		case 'lt':
			return typeof itemValue === 'number' && itemValue < (ruleValue as number);

		case 'lte':
			return typeof itemValue === 'number' && itemValue <= (ruleValue as number);

		case 'between': {
			if (typeof itemValue !== 'number' || !Array.isArray(ruleValue)) return false;
			const [min, max] = ruleValue as [number, number];
			return itemValue >= min && itemValue <= max;
		}

		case 'isEmpty':
			return isEmptyValue(itemValue);

		case 'isNotEmpty':
			return !isEmptyValue(itemValue);

		case 'includesAny': {
			if (!Array.isArray(itemValue) || !Array.isArray(ruleValue)) return false;
			return ruleValue.some((v) => itemValue.includes(v));
		}

		case 'includesAll': {
			if (!Array.isArray(itemValue) || !Array.isArray(ruleValue)) return false;
			return ruleValue.every((v) => itemValue.includes(v));
		}

		case 'excludesAny': {
			if (!Array.isArray(itemValue) || !Array.isArray(ruleValue)) return false;
			return ruleValue.some((v) => !itemValue.includes(v));
		}

		case 'excludesAll': {
			if (!Array.isArray(itemValue) || !Array.isArray(ruleValue)) return false;
			return ruleValue.every((v) => !itemValue.includes(v));
		}

		default:
			return false;
	}
}

function isEmptyValue(value: unknown): boolean {
	if (value == null) return true;
	if (typeof value === 'string') return value.length === 0;
	if (Array.isArray(value)) return value.length === 0;
	return false;
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Quick filter by tags (any match)
 */
export function filterByTags<T extends FilterableItem>(items: T[], tags: string[]): T[] {
	return filterItems(items, new ItemFilterBuilder().where('tags').includesAny(tags).build());
}

/**
 * Quick filter by folders (any match)
 */
export function filterByFolders<T extends FilterableItem>(items: T[], folderIds: string[]): T[] {
	return filterItems(items, new ItemFilterBuilder().where('folders').includesAny(folderIds).build());
}

/**
 * Quick filter by name pattern (regex)
 */
export function filterByName<T extends FilterableItem>(items: T[], pattern: RegExp | string): T[] {
	return filterItems(items, new ItemFilterBuilder().where('name').matches(pattern).build());
}

/**
 * Quick filter by extension
 */
export function filterByExtension<T extends FilterableItem>(items: T[], ext: string): T[] {
	const normalizedExt = ext.startsWith('.') ? ext.slice(1) : ext;
	return filterItems(items, new ItemFilterBuilder().where('ext').is(normalizedExt).build());
}

/**
 * Quick filter by star rating (minimum)
 */
export function filterByRating<T extends FilterableItem>(items: T[], minStars: number): T[] {
	return filterItems(items, new ItemFilterBuilder().where('star').gte(minStars).build());
}

/**
 * Quick filter for untagged items
 */
export function filterUntagged<T extends FilterableItem>(items: T[]): T[] {
	return filterItems(items, new ItemFilterBuilder().where('tags').isEmpty().build());
}

/**
 * Quick filter for unfiled items (not in any folder)
 */
export function filterUnfiled<T extends FilterableItem>(items: T[]): T[] {
	return filterItems(items, new ItemFilterBuilder().where('folders').isEmpty().build());
}

/**
 * Quick filter by date range (importedAt)
 */
export function filterByImportDate<T extends FilterableItem>(
	items: T[],
	from: Date | number,
	to: Date | number
): T[] {
	const fromTs = from instanceof Date ? from.getTime() : from;
	const toTs = to instanceof Date ? to.getTime() : to;
	return filterItems(items, new ItemFilterBuilder().where('importedAt').between(fromTs, toTs).build());
}

/**
 * Combine multiple filters with AND logic
 */
export function combineFilters(...filters: ItemFilter[]): ItemFilter {
	return {
		conditions: filters.flatMap((f) => f.conditions),
		match: 'AND',
	};
}

/**
 * Combine multiple filters with OR logic
 */
export function anyOfFilters(...filters: ItemFilter[]): ItemFilter {
	return {
		conditions: filters.flatMap((f) => f.conditions),
		match: 'OR',
	};
}
