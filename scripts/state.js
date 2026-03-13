/**
 * state.js
 * In-memory application state.
 * All feature modules read from and mutate through here.
 * After every mutation, call the appropriate save function to persist.
 */

import { loadData, saveData, getDefaultData } from './storage.js';

/**
 * The single in-memory data object.
 * Initialized by calling init().
 * @type {object}
 */
let _data = null;

// ─── Init ─────────────────────────────────────────────────────────────────────

/**
 * Load data from localStorage into memory. Must be called once on app startup.
 */
export function init() {
    const existing = localStorage.getItem('triki_data');
    if (!existing) {
        _data = getDefaultData();
        saveData(_data);
    } else {
        _data = loadData();
    }
}

/**
 * Replace all in-memory data (used after a successful Import).
 * Persists immediately.
 * @param {object} newData  Already-validated data object from validateImport()
 */
export function replaceAll(newData) {
    _data = newData;
    saveData(_data);
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/** @returns {object[]} Shallow copy of categories array */
export function getCategories() {
    return [..._data.categories];
}

/** @returns {object[]} Shallow copy of entries array */
export function getEntries() {
    return [..._data.entries];
}

/** @returns {object[]} Shallow copy of themes array */
export function getThemes() {
    return [..._data.themes];
}

/** @returns {string} ID of the currently active theme */
export function getActiveThemeId() {
    return _data.activeThemeId;
}

/**
 * Returns full data snapshot (used for Export).
 * Deep-copies to prevent external mutation.
 * @returns {object}
 */
export function getSnapshot() {
    return JSON.parse(JSON.stringify(_data));
}

// ─── Categories ───────────────────────────────────────────────────────────────

/**
 * Add a new category to state and persist.
 * @param {{ name: string, color: string, parentId: string|null }} fields
 * @returns {object} The created category object
 */
export function addCategory({ name, color, parentId = null }) {
    const category = {
        id: crypto.randomUUID(),
        name: name.trim(),
        color,
        parentId,
        order: _data.categories.length,
    };
    _data.categories.push(category);
    saveData(_data);
    return category;
}

/**
 * Update an existing category's fields and persist.
 * @param {string} id
 * @param {{ name?: string, color?: string, parentId?: string|null, order?: number }} updates
 * @returns {object|null} Updated category, or null if not found
 */
export function updateCategory(id, updates) {
    const idx = _data.categories.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    _data.categories[idx] = { ..._data.categories[idx], ...updates };
    saveData(_data);
    return _data.categories[idx];
}

/**
 * Delete a category by ID.
 * Blocked if the category has child categories or assigned entries.
 * @param {string} id
 * @returns {{ success: boolean, error?: string }}
 */
export function deleteCategory(id) {
    const hasChildren = _data.categories.some((c) => c.parentId === id);
    if (hasChildren) {
        return { success: false, error: 'Remove all subcategories before deleting this category.' };
    }
    const hasEntries = _data.entries.some((e) => e.categoryId === id);
    if (hasEntries) {
        return { success: false, error: 'Move or delete all notes in this category before deleting it.' };
    }
    _data.categories = _data.categories.filter((c) => c.id !== id);
    saveData(_data);
    return { success: true };
}

// ─── Entries ──────────────────────────────────────────────────────────────────

/**
 * Add a new entry (note) and persist.
 * @param {{ title: string, notes: string, categoryId: string|null }} fields
 * @returns {object} The created entry object
 */
export function addEntry({ title, notes, categoryId }) {
    const entry = {
        id: crypto.randomUUID(),
        title: title.trim(),
        notes,
        categoryId: categoryId || null,
        createdAt: new Date().toISOString(),
    };
    _data.entries.push(entry);
    saveData(_data);
    return entry;
}

/**
 * Update an entry's title, notes, or categoryId and persist.
 * @param {string} id
 * @param {{ title?: string, notes?: string, categoryId?: string|null }} updates
 * @returns {object|null} Updated entry, or null if not found
 */
export function updateEntry(id, updates) {
    const idx = _data.entries.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    _data.entries[idx] = { ..._data.entries[idx], ...updates };
    saveData(_data);
    return _data.entries[idx];
}

/**
 * Delete an entry by ID and persist.
 * @param {string} id
 * @returns {boolean} true if deleted, false if not found
 */
export function deleteEntry(id) {
    const before = _data.entries.length;
    _data.entries = _data.entries.filter((e) => e.id !== id);
    if (_data.entries.length === before) return false;
    saveData(_data);
    return true;
}

// ─── Themes ───────────────────────────────────────────────────────────────────

/**
 * Add or update a theme and persist.
 * If a theme with the given id already exists, it is overwritten.
 * Passing no id creates a new theme.
 * @param {{ id?: string, name: string, primary: string, secondary: string, tertiary: string, accent: string }} fields
 * @returns {object} The saved theme object
 */
export function saveTheme({ id, name, primary, secondary, tertiary, accent }) {
    const existingIdx = id ? _data.themes.findIndex((t) => t.id === id) : -1;
    const theme = {
        id: id || crypto.randomUUID(),
        name: name.trim(),
        primary,
        secondary,
        tertiary,
        accent,
    };
    if (existingIdx !== -1) {
        _data.themes[existingIdx] = theme;
    } else {
        _data.themes.push(theme);
    }
    saveData(_data);
    return theme;
}

/**
 * Delete a theme by ID.
 * Blocked if the theme is currently active.
 * @param {string} id
 * @returns {{ success: boolean, error?: string }}
 */
export function deleteTheme(id) {
    if (_data.activeThemeId === id) {
        return { success: false, error: 'Cannot delete the active theme. Switch to another theme first.' };
    }
    _data.themes = _data.themes.filter((t) => t.id !== id);
    saveData(_data);
    return { success: true };
}

/**
 * Set the active theme and persist.
 * @param {string} id
 * @returns {boolean} true if theme exists and was activated, false otherwise
 */
export function setActiveTheme(id) {
    const exists = _data.themes.some((t) => t.id === id);
    if (!exists) return false;
    _data.activeThemeId = id;
    saveData(_data);
    return true;
}
