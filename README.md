# Personal Custom Wiki

## Project Overview
Triki is a static frontend Personal Wiki built with HTML, CSS, and JavaScript.

The app organizes notes in a color-coded structure with browser persistence via localStorage. No backend is required.

## Original Planning Baseline (Conversation Start)

This README section records the original plan, recommendations, and warnings from the beginning of the project conversation so continuation work stays aligned with the initial strategy.

## Initial Project State
- Foundation was visually in place: CSS variables, sidebar/main layout, static placeholders.
- Functional behavior was expected to be implemented in JavaScript modules.

## Deliverable-by-Deliverable Plan Notes

### 1. Storage - JSON in localStorage
Good:
- Schema direction is correct: schemaVersion, categories with parentId, entries with categoryId, themes array.

Suggestions:
- Add createdAt on entries for sorting/debugging.
- Use namespaced localStorage key: triki_data.
- Use crypto.randomUUID() for IDs.
- Wrap setItem calls in try/catch to handle quota errors.

Warnings:
- localStorage has size limits (around 5MB); large notes can approach limits.

### 2. CRUD + Tree View
Good:
- Landing-page inline expand/collapse, inline edit, category reassignment, and delete controls provide tight UX.

Suggestions:
- Keep terminology clear: category tree in sidebar, note list/card stack in main view.
- Use textarea auto-resize for inline note editing.
- Prefer debounced auto-save for note text edits (for example around 800ms).
- Category changes should save immediately.
- Re-categorization should provide visual continuity (animation or highlight in new location).

Warnings:
- Destructive delete should include confirmation or undo.
- Category deletion behavior must be explicit. Recommended: block deletion until category has no children and no notes.

### 3. Search + Filter
Good:
- Live search/filter without reload is correct.

Suggestions:
- Debounce search input (about 150-200ms).
- Show explicit empty state when no results match.
- Hide empty category sections for cleaner results.
- Use AND logic when combining search query and category filter.

Warnings:
- Combined filter behavior must be documented in UI hints.

### 4. Import / Export
Good:
- JSON backup/restore is appropriate for localStorage architecture.

Suggestions:
- Use timestamped export filenames, for example triki-backup-YYYY-MM-DD.json.
- Confirm before replacing all current data.
- Validate imported schema before accepting.

Warnings:
- Parse only with JSON.parse, never eval.
- Sanitize imported data and keep only expected fields.
- For safer replacement, validate before final write and avoid partial state transitions.

### 5. Custom Theme Editor
Suggestions:
- Pair hex text input with input type=color.
- Sync picker and hex input bidirectionally.
- Apply live CSS variables with document.documentElement.style.setProperty.
- Persist activeThemeId at schema root.
- Provide per-theme Delete theme with guard to prevent deleting active theme.

Warnings:
- Avoid overcrowding root toolbar with full theme editor controls.
- Validate hex format (#RRGGBB or #RGB) before applying.

### 6. Sidebar Category Legend + New Category
Good:
- Sidebar legend doubles as navigation/filter surface.

Suggestions:
- Use input type=color for category creation and editing.
- Show note counts per category.
- Allow parent category selection for nesting.
- Make category rows click-to-filter main notes.

Warnings:
- Guard category deletion when notes/children still exist.
- Watch deep nesting usability in sidebar.

## Architecture Guardrail

To keep complexity manageable, use module separation:
- storage.js: localStorage load/save/default/validation, no DOM.
- state.js: in-memory state and mutation methods.
- render.js: UI rendering only.
- app.js: event binding, orchestration, startup.

## Revised Data Schema (Planning Canonical)

{
  "schemaVersion": 1,
  "activeThemeId": "theme-default",
  "categories": [
    {
      "id": "cat-1",
      "name": "Programming",
      "color": "#4f46e5",
      "parentId": null,
      "order": 0
    }
  ],
  "entries": [
    {
      "id": "entry-1",
      "title": "Array Methods",
      "notes": "map, filter, reduce...",
      "categoryId": "cat-1",
      "createdAt": "2026-03-13T00:00:00Z"
    }
  ],
  "themes": [
    {
      "id": "theme-default",
      "name": "Default",
      "primary": "#f3f4f6",
      "secondary": "#e5e7eb",
      "tertiary": "#d1d5db",
      "accent": "#6b7280"
    }
  ]
}

Planning deltas from earliest draft:
- Added activeThemeId.
- Added createdAt on entries.
- Added order on categories.

## Recommended Build Order (Original)
1. Storage module: defaults, load/save, safety checks.
2. Category sidebar: render and create first.
3. Note list read/create.
4. Note CRUD: expand, edit, delete, recategorize.
5. Search/filter.
6. Import/export.
7. Theme editor and preset management.

## Definition of Done (Mid-Term)
- Core features functional with browser persistence.
- No backend dependency.
- Data survives refresh and browser reopen.
- Baseline accessibility: labels, keyboard navigation, contrast.
- README documents plan, architecture, and continuation strategy.

## Continuation Focus (Current)
- Finalize full theme editor UI and saved preset controls.
- Ensure live CSS variable preview for all theme updates.
- Preserve active theme across sessions via activeThemeId.
- Guard against deleting the currently active theme.
