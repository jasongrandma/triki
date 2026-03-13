/**
 * storage.js
 * Pure localStorage utility — no DOM access.
 * All reads and writes to localStorage go through here.
 */

const STORAGE_KEY = 'triki_data';

/**
 * Default data structure.
 * Always returns a deep copy so callers cannot mutate the template.
 * @returns {object}
 */
export function getDefaultData() {
    return {
        schemaVersion: 1,
        activeThemeId: 'theme-default',
        categories: [],
        entries: [],
        themes: [
            {
                id: 'theme-default',
                name: 'Default',
                primary: '#f3f4f6',
                secondary: '#e5e7eb',
                tertiary: '#d1d5db',
                accent: '#6b7280',
            },
            {
                id: 'theme-ocean',
                name: 'Ocean',
                primary: '#e0f2fe',
                secondary: '#bae6fd',
                tertiary: '#7dd3fc',
                accent: '#0369a1',
            },
            {
                id: 'theme-tree',
                name: 'Tree',
                primary: '#ecfdf5',
                secondary: '#bbf7d0',
                tertiary: '#86efac',
                accent: '#166534',
            },
            {
                id: 'theme-mountain',
                name: 'Mountain',
                primary: '#f1f5f9',
                secondary: '#cbd5e1',
                tertiary: '#94a3b8',
                accent: '#334155',
            },
        ],
    };
}

/**
 * Load data from localStorage.
 * Returns default data if nothing is stored yet.
 * @returns {object}
 */
export function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return getDefaultData();
        const parsed = JSON.parse(raw);
        return mergeWithDefaults(parsed);
    } catch {
        console.warn('[triki] Failed to parse stored data. Returning defaults.');
        return getDefaultData();
    }
}

/**
 * Save data to localStorage.
 * Wraps setItem in a try/catch to surface quota errors gracefully.
 * @param {object} data
 * @returns {boolean} true if save succeeded, false on error
 */
export function saveData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
    } catch (err) {
        if (err.name === 'QuotaExceededError') {
            console.error('[triki] localStorage quota exceeded. Save failed.');
        } else {
            console.error('[triki] Unexpected save error:', err);
        }
        return false;
    }
}

/**
 * Wipe all triki data from localStorage.
 */
export function clearData() {
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Validate and sanitize an imported JSON object before it can replace live data.
 * Returns { valid: true, data } on success, or { valid: false, error: string } on failure.
 * Only whitelisted top-level keys are kept — extra keys are dropped to prevent unexpected state.
 * @param {unknown} raw  Parsed JSON value from an imported file
 * @returns {{ valid: boolean, data?: object, error?: string }}
 */
export function validateImport(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return { valid: false, error: 'Root must be a JSON object.' };
    }

    if (!Array.isArray(raw.categories)) {
        return { valid: false, error: 'Missing or invalid "categories" array.' };
    }

    if (!Array.isArray(raw.entries)) {
        return { valid: false, error: 'Missing or invalid "entries" array.' };
    }

    if (!Array.isArray(raw.themes)) {
        return { valid: false, error: 'Missing or invalid "themes" array.' };
    }

    // Whitelist: only keep known top-level keys
    const sanitized = {
        schemaVersion: typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 1,
        activeThemeId: typeof raw.activeThemeId === 'string' ? raw.activeThemeId : 'theme-default',
        categories: raw.categories.map(sanitizeCategory).filter(Boolean),
        entries: raw.entries.map(sanitizeEntry).filter(Boolean),
        themes: raw.themes.map(sanitizeTheme).filter(Boolean),
    };

    // Ensure at least one theme exists after sanitization
    if (sanitized.themes.length === 0) {
        sanitized.themes = getDefaultData().themes;
        sanitized.activeThemeId = 'theme-default';
    }

    return { valid: true, data: sanitized };
}

// ─── Internal sanitizers ───────────────────────────────────────────────────

/**
 * @param {unknown} c
 * @returns {object|null}
 */
function sanitizeCategory(c) {
    if (!c || typeof c !== 'object') return null;
    if (typeof c.id !== 'string' || !c.id) return null;
    if (typeof c.name !== 'string' || !c.name.trim()) return null;
    return {
        id: c.id,
        name: c.name.trim(),
        color: isHexColor(c.color) ? c.color : '#6b7280',
        parentId: typeof c.parentId === 'string' ? c.parentId : null,
        order: typeof c.order === 'number' ? c.order : 0,
    };
}

/**
 * @param {unknown} e
 * @returns {object|null}
 */
function sanitizeEntry(e) {
    if (!e || typeof e !== 'object') return null;
    if (typeof e.id !== 'string' || !e.id) return null;
    if (typeof e.title !== 'string' || !e.title.trim()) return null;
    return {
        id: e.id,
        title: e.title.trim(),
        notes: typeof e.notes === 'string' ? e.notes : '',
        categoryId: typeof e.categoryId === 'string' ? e.categoryId : null,
        createdAt: typeof e.createdAt === 'string' ? e.createdAt : new Date().toISOString(),
    };
}

/**
 * @param {unknown} t
 * @returns {object|null}
 */
function sanitizeTheme(t) {
    if (!t || typeof t !== 'object') return null;
    if (typeof t.id !== 'string' || !t.id) return null;
    if (typeof t.name !== 'string' || !t.name.trim()) return null;
    return {
        id: t.id,
        name: t.name.trim(),
        primary: isHexColor(t.primary) ? t.primary : '#f3f4f6',
        secondary: isHexColor(t.secondary) ? t.secondary : '#e5e7eb',
        tertiary: isHexColor(t.tertiary) ? t.tertiary : '#d1d5db',
        accent: isHexColor(t.accent) ? t.accent : '#6b7280',
    };
}

/**
 * Accepts #RGB and #RRGGBB hex formats only.
 * @param {unknown} value
 * @returns {boolean}
 */
function isHexColor(value) {
    return typeof value === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}

/**
 * Ensure loaded data has all required keys (handles data from older schema versions).
 * Merges missing keys from defaults without overwriting existing data.
 * @param {object} data
 * @returns {object}
 */
function mergeWithDefaults(data) {
    const defaults = getDefaultData();
    const incomingThemes = Array.isArray(data.themes) ? data.themes : [];
    const incomingThemeIds = new Set(incomingThemes.map((t) => t?.id).filter(Boolean));
    const mergedThemes = [...incomingThemes];

    // Backfill newly introduced built-in themes for older saved data.
    for (const baseTheme of defaults.themes) {
        if (!incomingThemeIds.has(baseTheme.id)) {
            mergedThemes.push({ ...baseTheme });
        }
    }

    return {
        schemaVersion: data.schemaVersion ?? defaults.schemaVersion,
        activeThemeId: data.activeThemeId ?? defaults.activeThemeId,
        categories: Array.isArray(data.categories) ? data.categories : defaults.categories,
        entries: Array.isArray(data.entries) ? data.entries : defaults.entries,
        themes: mergedThemes.length > 0 ? mergedThemes : defaults.themes,
    };
}
