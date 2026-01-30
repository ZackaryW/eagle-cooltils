import { useState, useCallback, useEffect } from 'react';
import type { FilterProperty, FilterMethod, FilterRule, FilterCondition, ItemFilter } from '../hooks/useEagle';
import { useEagle, useFilterPresets, useLastFilter } from '../hooks/useEagle';
import type { FilterPreset } from '../hooks/useEagle';

// ============================================================================
// Constants
// ============================================================================

const PROPERTIES: { value: FilterProperty; label: string; type: 'string' | 'number' | 'array' | 'boolean' }[] = [
  { value: 'name', label: 'Name', type: 'string' },
  { value: 'ext', label: 'Extension', type: 'string' },
  { value: 'tags', label: 'Tags', type: 'array' },
  { value: 'folders', label: 'Folders', type: 'array' },
  { value: 'annotation', label: 'Annotation', type: 'string' },
  { value: 'url', label: 'URL', type: 'string' },
  { value: 'star', label: 'Rating', type: 'number' },
  { value: 'width', label: 'Width', type: 'number' },
  { value: 'height', label: 'Height', type: 'number' },
  { value: 'size', label: 'Size (bytes)', type: 'number' },
  { value: 'importedAt', label: 'Import Date', type: 'number' },
  { value: 'modifiedAt', label: 'Modified Date', type: 'number' },
  { value: 'isDeleted', label: 'Is Deleted', type: 'boolean' },
];

const STRING_METHODS: { value: FilterMethod; label: string }[] = [
  { value: 'is', label: 'is' },
  { value: 'isNot', label: 'is not' },
  { value: 'contains', label: 'contains' },
  { value: 'notContains', label: 'does not contain' },
  { value: 'startsWith', label: 'starts with' },
  { value: 'endsWith', label: 'ends with' },
  { value: 'matches', label: 'matches regex' },
  { value: 'isEmpty', label: 'is empty' },
  { value: 'isNotEmpty', label: 'is not empty' },
];

const NUMBER_METHODS: { value: FilterMethod; label: string }[] = [
  { value: 'is', label: 'equals' },
  { value: 'isNot', label: 'not equals' },
  { value: 'gt', label: 'greater than' },
  { value: 'gte', label: 'greater or equal' },
  { value: 'lt', label: 'less than' },
  { value: 'lte', label: 'less or equal' },
  { value: 'between', label: 'between' },
];

const ARRAY_METHODS: { value: FilterMethod; label: string }[] = [
  { value: 'includesAny', label: 'includes any of' },
  { value: 'includesAll', label: 'includes all of' },
  { value: 'excludesAny', label: 'excludes any of' },
  { value: 'excludesAll', label: 'excludes all of' },
  { value: 'isEmpty', label: 'is empty' },
  { value: 'isNotEmpty', label: 'is not empty' },
];

const BOOLEAN_METHODS: { value: FilterMethod; label: string }[] = [
  { value: 'is', label: 'is' },
];

function getMethodsForType(type: string) {
  switch (type) {
    case 'string': return STRING_METHODS;
    case 'number': return NUMBER_METHODS;
    case 'array': return ARRAY_METHODS;
    case 'boolean': return BOOLEAN_METHODS;
    default: return STRING_METHODS;
  }
}

// ============================================================================
// Icons
// ============================================================================

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const FilterIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const SaveIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

const FolderOpenIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

// ============================================================================
// Folder Picker (resolves folder names to IDs)
// ============================================================================

interface FolderPickerProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  folders: Folder[];
}

function FolderPicker({ selectedIds, onChange, folders }: FolderPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Build a flat list with indentation for nested folders
  const flattenFolders = (items: Folder[], level = 0): { folder: Folder; level: number }[] => {
    const result: { folder: Folder; level: number }[] = [];
    for (const folder of items.filter(f => f.parent === null || level > 0)) {
      if (level === 0 && folder.parent !== null) continue;
      result.push({ folder, level });
      // Find children
      const children = folders.filter(f => f.parent === folder.id);
      if (children.length > 0) {
        result.push(...flattenFoldersRecursive(children, level + 1));
      }
    }
    return result;
  };

  const flattenFoldersRecursive = (items: Folder[], level: number): { folder: Folder; level: number }[] => {
    const result: { folder: Folder; level: number }[] = [];
    for (const folder of items) {
      result.push({ folder, level });
      const children = folders.filter(f => f.parent === folder.id);
      if (children.length > 0) {
        result.push(...flattenFoldersRecursive(children, level + 1));
      }
    }
    return result;
  };

  const rootFolders = folders.filter(f => f.parent === null);
  const flatList = flattenFolders(rootFolders, 0);

  // Get folder by ID for display
  const getFolderById = (id: string) => folders.find(f => f.id === id);

  const toggleFolder = (folderId: string) => {
    if (selectedIds.includes(folderId)) {
      onChange(selectedIds.filter(id => id !== folderId));
    } else {
      onChange([...selectedIds, folderId]);
    }
  };

  const selectedNames = selectedIds
    .map(id => getFolderById(id)?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <div className="dropdown dropdown-end flex-1 min-w-[200px]">
      <label
        tabIndex={0}
        className="input input-sm input-bordered flex items-center gap-2 cursor-pointer w-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex-1 truncate text-left">
          {selectedIds.length === 0 ? (
            <span className="text-base-content/50">Select folders...</span>
          ) : (
            selectedNames
          )}
        </span>
        <span className="badge badge-sm badge-primary">{selectedIds.length}</span>
      </label>
      {isOpen && (
        <div
          tabIndex={0}
          className="dropdown-content z-50 mt-1 p-2 shadow-lg bg-base-100 rounded-box w-72 max-h-60 overflow-y-auto border border-base-300"
        >
          {flatList.length === 0 ? (
            <div className="text-sm text-base-content/50 p-2">No folders</div>
          ) : (
            flatList.map(({ folder, level }) => (
              <label
                key={folder.id}
                className="flex items-center gap-2 p-1.5 hover:bg-base-200 rounded cursor-pointer"
                style={{ paddingLeft: `${level * 16 + 8}px` }}
              >
                <input
                  type="checkbox"
                  className="checkbox checkbox-xs checkbox-primary"
                  checked={selectedIds.includes(folder.id)}
                  onChange={() => toggleFolder(folder.id)}
                />
                <span className="text-sm truncate">{folder.name}</span>
              </label>
            ))
          )}
          <div className="divider my-1"></div>
          <button
            className="btn btn-xs btn-ghost w-full"
            onClick={() => {
              onChange([]);
              setIsOpen(false);
            }}
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Rule Editor
// ============================================================================

interface RuleEditorProps {
  rule: FilterRule;
  onChange: (rule: FilterRule) => void;
  onRemove: () => void;
  isOnly: boolean;
  folders: Folder[];
}

function RuleEditor({ rule, onChange, onRemove, isOnly, folders }: RuleEditorProps) {
  const propertyDef = PROPERTIES.find(p => p.value === rule.property) || PROPERTIES[0];
  const methods = getMethodsForType(propertyDef.type);
  const needsValue = !['isEmpty', 'isNotEmpty'].includes(rule.method);
  const needsSecondValue = rule.method === 'between';
  const isFoldersProperty = rule.property === 'folders';

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-base-200 rounded-lg">
      {/* Property Select */}
      <select
        className="select select-sm select-bordered flex-shrink-0"
        value={rule.property}
        onChange={(e) => {
          const prop = e.target.value as FilterProperty;
          const propDef = PROPERTIES.find(p => p.value === prop)!;
          const newMethods = getMethodsForType(propDef.type);
          onChange({
            property: prop,
            method: newMethods[0].value,
            value: propDef.type === 'boolean' ? false : propDef.type === 'array' ? [] : '',
          });
        }}
      >
        {PROPERTIES.map(p => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>

      {/* Method Select */}
      <select
        className="select select-sm select-bordered flex-shrink-0"
        value={rule.method}
        onChange={(e) => onChange({ ...rule, method: e.target.value as FilterMethod })}
      >
        {methods.map(m => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>

      {/* Value Input */}
      {needsValue && (
        <>
          {propertyDef.type === 'boolean' ? (
            <select
              className="select select-sm select-bordered"
              value={String(rule.value)}
              onChange={(e) => onChange({ ...rule, value: e.target.value === 'true' })}
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          ) : propertyDef.type === 'array' ? (
            isFoldersProperty ? (
              <FolderPicker
                selectedIds={Array.isArray(rule.value) ? rule.value : []}
                onChange={(ids) => onChange({ ...rule, value: ids })}
                folders={folders}
              />
            ) : (
              <input
                type="text"
                className="input input-sm input-bordered flex-1 min-w-[150px]"
                placeholder="value1, value2, ..."
                value={Array.isArray(rule.value) ? rule.value.join(', ') : ''}
                onChange={(e) => onChange({
                  ...rule,
                  value: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                })}
              />
            )
          ) : propertyDef.type === 'number' ? (
            <>
              <input
                type="number"
                className="input input-sm input-bordered w-24"
                placeholder="value"
                value={needsSecondValue && Array.isArray(rule.value) ? rule.value[0] : (rule.value as number) || ''}
                onChange={(e) => {
                  const num = Number(e.target.value);
                  if (needsSecondValue) {
                    const arr = Array.isArray(rule.value) ? [...rule.value] : [0, 0];
                    arr[0] = num;
                    onChange({ ...rule, value: arr });
                  } else {
                    onChange({ ...rule, value: num });
                  }
                }}
              />
              {needsSecondValue && (
                <>
                  <span className="text-sm">and</span>
                  <input
                    type="number"
                    className="input input-sm input-bordered w-24"
                    placeholder="max"
                    value={Array.isArray(rule.value) ? rule.value[1] : ''}
                    onChange={(e) => {
                      const arr = Array.isArray(rule.value) ? [...rule.value] : [0, 0];
                      arr[1] = Number(e.target.value);
                      onChange({ ...rule, value: arr });
                    }}
                  />
                </>
              )}
            </>
          ) : (
            <input
              type="text"
              className="input input-sm input-bordered flex-1 min-w-[150px]"
              placeholder="value"
              value={(rule.value as string) || ''}
              onChange={(e) => onChange({ ...rule, value: e.target.value })}
            />
          )}
        </>
      )}

      {/* Remove Button */}
      <button
        className="btn btn-ghost btn-sm btn-square text-error"
        onClick={onRemove}
        disabled={isOnly}
      >
        <TrashIcon />
      </button>
    </div>
  );
}

// ============================================================================
// Condition Editor
// ============================================================================

interface ConditionEditorProps {
  condition: FilterCondition;
  onChange: (condition: FilterCondition) => void;
  onRemove: () => void;
  isOnly: boolean;
  conditionIndex: number;
  folders: Folder[];
}

function ConditionEditor({ condition, onChange, onRemove, isOnly, conditionIndex, folders }: ConditionEditorProps) {
  const addRule = () => {
    onChange({
      ...condition,
      rules: [...condition.rules, { property: 'name', method: 'contains', value: '' }],
    });
  };

  const updateRule = (index: number, rule: FilterRule) => {
    const newRules = [...condition.rules];
    newRules[index] = rule;
    onChange({ ...condition, rules: newRules });
  };

  const removeRule = (index: number) => {
    onChange({ ...condition, rules: condition.rules.filter((_: FilterRule, i: number) => i !== index) });
  };

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="badge badge-primary">Condition {conditionIndex + 1}</span>
            <select
              className="select select-xs select-bordered"
              value={condition.match}
              onChange={(e) => onChange({ ...condition, match: e.target.value as 'AND' | 'OR' })}
            >
              <option value="AND">Match ALL rules</option>
              <option value="OR">Match ANY rule</option>
            </select>
          </div>
          <button
            className="btn btn-ghost btn-xs text-error"
            onClick={onRemove}
            disabled={isOnly}
          >
            Remove
          </button>
        </div>

        {/* Rules */}
        <div className="space-y-2">
          {condition.rules.map((rule: FilterRule, index: number) => (
            <div key={index} className="flex items-start gap-2">
              {index > 0 && (
                <span className="text-xs font-semibold text-primary pt-4 w-8">
                  {condition.match}
                </span>
              )}
              <div className="flex-1">
                <RuleEditor
                  rule={rule}
                  onChange={(r) => updateRule(index, r)}
                  onRemove={() => removeRule(index)}
                  isOnly={condition.rules.length === 1}
                  folders={folders}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add Rule */}
        <button className="btn btn-ghost btn-sm gap-1 mt-2" onClick={addRule}>
          <PlusIcon /> Add Rule
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Filter Builder Component
// ============================================================================

interface FilterBuilderProps {
  filter: ItemFilter;
  onChange: (filter: ItemFilter) => void;
  onApply?: () => void;
  onClear?: () => void;
  resultCount?: number;
  /** Enable preset persistence (save/load filter presets) */
  enablePresets?: boolean;
  /** Auto-save the filter as "last used" for this library */
  autoSaveLastFilter?: boolean;
}

export function FilterBuilder({
  filter,
  onChange,
  onApply,
  onClear,
  resultCount,
  enablePresets = true,
  autoSaveLastFilter = true,
}: FilterBuilderProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const { folders } = useEagle();

  // Preset hooks
  const { presets, savePreset, deletePreset, loading: presetsLoading } = useFilterPresets();
  const { lastFilter, setLastFilter, loading: lastFilterLoading } = useLastFilter();

  // Load last filter on mount
  useEffect(() => {
    if (autoSaveLastFilter && !lastFilterLoading && lastFilter && filter.conditions.length === 0) {
      onChange(lastFilter);
    }
  }, [lastFilterLoading]);

  // Auto-save current filter as last used
  useEffect(() => {
    if (autoSaveLastFilter && !lastFilterLoading) {
      setLastFilter(filter);
    }
  }, [filter, autoSaveLastFilter, lastFilterLoading]);

  const addCondition = () => {
    onChange({
      ...filter,
      conditions: [
        ...filter.conditions,
        { rules: [{ property: 'name', method: 'contains', value: '' }], match: 'AND' },
      ],
    });
  };

  const updateCondition = (index: number, condition: FilterCondition) => {
    const newConditions = [...filter.conditions];
    newConditions[index] = condition;
    onChange({ ...filter, conditions: newConditions });
  };

  const removeCondition = (index: number) => {
    onChange({ ...filter, conditions: filter.conditions.filter((_: FilterCondition, i: number) => i !== index) });
  };

  const clearFilter = () => {
    onChange({ conditions: [], match: 'AND' });
    onClear?.();
  };

  const hasFilter = filter.conditions.length > 0;

  return (
    <div className="bg-base-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-base-300 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <FilterIcon />
          <span className="font-semibold">Filter Builder</span>
          {hasFilter && (
            <span className="badge badge-primary">
              {filter.conditions.length} condition{filter.conditions.length !== 1 ? 's' : ''}
            </span>
          )}
          {resultCount !== undefined && (
            <span className="badge badge-ghost">{resultCount} results</span>
          )}
        </div>
        <svg
          className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4 border-t border-base-300">
          {/* Condition Match */}
          {filter.conditions.length > 1 && (
            <div className="flex items-center gap-2 text-sm">
              <span>Items matching</span>
              <select
                className="select select-sm select-bordered"
                value={filter.match}
                onChange={(e) => onChange({ ...filter, match: e.target.value as 'AND' | 'OR' })}
              >
                <option value="AND">ALL conditions</option>
                <option value="OR">ANY condition</option>
              </select>
            </div>
          )}

          {/* Conditions */}
          <div className="space-y-3">
            {filter.conditions.map((condition: FilterCondition, index: number) => (
              <div key={index}>
                {index > 0 && (
                  <div className="flex items-center gap-2 my-2">
                    <div className="flex-1 h-px bg-base-300" />
                    <span className="text-xs font-bold text-secondary">{filter.match}</span>
                    <div className="flex-1 h-px bg-base-300" />
                  </div>
                )}
                <ConditionEditor
                  condition={condition}
                  onChange={(c) => updateCondition(index, c)}
                  onRemove={() => removeCondition(index)}
                  isOnly={filter.conditions.length === 1}
                  conditionIndex={index}
                  folders={folders}
                />
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 flex-wrap">
            <button className="btn btn-primary btn-sm gap-1" onClick={addCondition}>
              <PlusIcon /> Add Condition
            </button>
            {hasFilter && (
              <>
                <button className="btn btn-ghost btn-sm" onClick={clearFilter}>
                  Clear All
                </button>
                {onApply && (
                  <button className="btn btn-secondary btn-sm" onClick={onApply}>
                    Apply Filter
                  </button>
                )}
              </>
            )}

            {/* Preset buttons */}
            {enablePresets && (
              <div className="flex items-center gap-1 ml-auto">
                <button
                  className="btn btn-outline btn-sm gap-1"
                  onClick={(e) => { e.stopPropagation(); setShowLoadModal(true); }}
                  disabled={presetsLoading || presets.length === 0}
                  title={presets.length === 0 ? 'No saved presets' : 'Load preset'}
                >
                  <FolderOpenIcon />
                  <span className="hidden sm:inline">Load</span>
                  {presets.length > 0 && (
                    <span className="badge badge-xs badge-primary">{presets.length}</span>
                  )}
                </button>
                <button
                  className="btn btn-outline btn-sm gap-1"
                  onClick={(e) => { e.stopPropagation(); setShowSaveModal(true); }}
                  disabled={!hasFilter}
                  title={hasFilter ? 'Save as preset' : 'Add conditions to save'}
                >
                  <SaveIcon />
                  <span className="hidden sm:inline">Save</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Preset Modal */}
      {showSaveModal && (
        <div className="modal modal-open" onClick={() => setShowSaveModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <SaveIcon /> Save Filter Preset
            </h3>
            <div className="py-4">
              <label className="label">
                <span className="label-text">Preset Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="My Filter"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && presetName.trim()) {
                    savePreset(presetName.trim(), filter);
                    setPresetName('');
                    setShowSaveModal(false);
                  }
                }}
                autoFocus
              />
              <p className="text-sm text-base-content/60 mt-2">
                {filter.conditions.length} condition{filter.conditions.length !== 1 ? 's' : ''} will be saved
              </p>
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowSaveModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={!presetName.trim()}
                onClick={() => {
                  savePreset(presetName.trim(), filter);
                  setPresetName('');
                  setShowSaveModal(false);
                }}
              >
                Save Preset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Preset Modal */}
      {showLoadModal && (
        <div className="modal modal-open" onClick={() => setShowLoadModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <FolderOpenIcon /> Load Filter Preset
            </h3>
            <div className="py-4 space-y-2 max-h-80 overflow-y-auto">
              {presets.length === 0 ? (
                <p className="text-base-content/60">No saved presets</p>
              ) : (
                presets.map((preset: FilterPreset) => (
                  <div
                    key={preset.id}
                    className="flex items-center gap-2 p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors"
                  >
                    <button
                      className="flex-1 text-left"
                      onClick={() => {
                        onChange(preset.filter);
                        setShowLoadModal(false);
                      }}
                    >
                      <div className="font-medium">{preset.name}</div>
                      <div className="text-xs text-base-content/60">
                        {preset.filter.conditions.length} condition{preset.filter.conditions.length !== 1 ? 's' : ''}
                        {' · '}
                        {new Date(preset.updatedAt).toLocaleDateString()}
                      </div>
                    </button>
                    <button
                      className="btn btn-ghost btn-xs text-error"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePreset(preset.id);
                      }}
                      title="Delete preset"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => setShowLoadModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Hook for using filter builder
// ============================================================================

export function useFilterBuilder(): [ItemFilter, (filter: ItemFilter) => void, () => void] {
  const [filter, setFilter] = useState<ItemFilter>({ conditions: [], match: 'AND' });
  
  const clearFilter = useCallback(() => {
    setFilter({ conditions: [], match: 'AND' });
  }, []);

  return [filter, setFilter, clearFilter];
}
