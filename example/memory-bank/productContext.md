# Product Context: Eagle Filter Explorer

## Why This Plugin Exists
Eagle's built-in search is powerful but lacks visual condition-building. This plugin provides:
1. A test bed for `eagle-cooltils` filter functionality
2. An intuitive GUI for constructing complex queries
3. Real-time filtering without modifying library

## Problems It Solves
- **Complex Queries**: Build multi-condition filters visually
- **Folder + Filter Combo**: Combine folder selection with property filters
- **Learning Curve**: Visual builder shows available properties and methods
- **Testing**: Validates eagle-cooltils filter API against real libraries

## How It Works
1. User selects folder (optional) in left sidebar
2. User adds filter conditions in Filter Builder panel
3. Items matching both folder and filter display in grid
4. Result count updates in real-time

## User Experience Goals
- **Immediate Feedback**: Results update as filters change
- **Discoverable**: Property/method dropdowns show all options
- **Intuitive**: AND/OR logic clearly visualized
- **Responsive**: Handles 1000+ items smoothly

## Key Workflows
### Basic Filtering
1. Open plugin
2. Add condition: `name` → `contains` → "logo"
3. See matching items immediately

### Complex Query
1. Add condition 1: `tags` → `includesAny` → ["photo", "screenshot"]
2. Add condition 2: `star` → `gte` → 3
3. Set conditions to match "ALL"
4. Results: starred photos/screenshots

### Folder Scoping
1. Select folder in sidebar
2. Add filter on top
3. Results scoped to folder AND filter
