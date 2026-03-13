/**
 * render.js
 * All DOM rendering functions. Reads from state — never writes to it.
 * Each function is responsible for one part of the UI.
 * Populated in subsequent milestones.
 */

import { getCategories, getEntries, getThemes, getActiveThemeId } from './state.js';

// ─── Theme ────────────────────────────────────────────────────────────────────

/**
 * Apply the active theme's colors as CSS variables on :root.
 * Called on init and whenever the active theme changes.
 */
export function applyActiveTheme() {
    const themes = getThemes();
    const activeId = getActiveThemeId();
    const theme = themes.find((t) => t.id === activeId) ?? themes[0];
    if (!theme) return;

    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-secondary', theme.secondary);
    root.style.setProperty('--color-tertiary', theme.tertiary);
    root.style.setProperty('--color-accent', theme.accent);
}

// ─── Tree (Main Content) ──────────────────────────────────────────────────────

/**
 * Render the full note tree grouped by category into #main-tree.
 * @param {{ filterCategoryId?: string|null, searchQuery?: string, searchScope?: 'both'|'title'|'text' }} options
 */
export function renderTree({ filterCategoryId = null, searchQuery = '', searchScope = 'both' } = {}) {
    const container = document.getElementById('main-tree');
    if (!container) return;
    container.textContent = '';

    const categories = getCategories();
    const entries = getEntries();

    // Apply filters
    let filtered = entries;
    if (filterCategoryId) {
        if (filterCategoryId === '__uncategorized__') {
            filtered = filtered.filter((e) => !e.categoryId);
        } else {
            filtered = filtered.filter((e) => e.categoryId === filterCategoryId);
        }
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
        filtered = filtered.filter((e) => {
            const inTitle = e.title.toLowerCase().includes(q);
            const inText = e.notes.toLowerCase().includes(q);
            if (searchScope === 'title') return inTitle;
            if (searchScope === 'text') return inText;
            return inTitle || inText;
        });
    }

    // Empty state
    if (filtered.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'tree-empty';
        empty.textContent =
            entries.length === 0
                ? 'No notes yet. Click + to create your first note.'
                : 'No notes match.';
        container.appendChild(empty);
        return;
    }

    // Build ordered groups: uncategorized first (root), categories next
    const sorted = [...categories].sort((a, b) => a.order - b.order);
    const groups = new Map();
    groups.set(null, { cat: null, entries: [] });
    for (const cat of sorted) groups.set(cat.id, { cat, entries: [] });

    for (const entry of filtered) {
        const key = entry.categoryId && groups.has(entry.categoryId) ? entry.categoryId : null;
        groups.get(key).entries.push(entry);
    }

    let isFirst = true;
    for (const { cat, entries: groupEntries } of groups.values()) {
        if (groupEntries.length === 0) continue;

        if (!isFirst) {
            const connector = document.createElement('div');
            connector.className = 'tree-group-connector';
            connector.setAttribute('aria-hidden', 'true');
            container.appendChild(connector);
        }
        isFirst = false;

        const catColor = cat ? cat.color : '#9ca3af';
        const group = document.createElement('div');
        group.className = 'note-group';

        for (const entry of groupEntries) {
            group.appendChild(_buildNoteItem(entry, categories, catColor));
        }
        container.appendChild(group);
    }
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

/**
 * Render the category legend list in #sidebar-category-list.
 * @param {{ activeCategoryId?: string|null }} options
 */
export function renderSidebar({ activeCategoryId = null } = {}) {
    const list = document.getElementById('sidebar-category-list');
    if (!list) return;
    list.textContent = '';

    const categories = getCategories();
    const entries = getEntries();

    const sorted = [...categories].sort((a, b) => a.order - b.order);
    const catIds = new Set(categories.map((c) => c.id));
    const uncategorizedCount = entries.filter((e) => !e.categoryId).length;
    const childMap = new Map();
    for (const c of categories) {
        if (!childMap.has(c.parentId)) childMap.set(c.parentId, []);
        childMap.get(c.parentId).push(c.id);
    }

    function getDescendantIds(categoryId) {
        const descendants = new Set();
        const stack = [...(childMap.get(categoryId) ?? [])];
        while (stack.length > 0) {
            const id = stack.pop();
            if (descendants.has(id)) continue;
            descendants.add(id);
            const children = childMap.get(id) ?? [];
            for (const childId of children) stack.push(childId);
        }
        return descendants;
    }

    if (uncategorizedCount > 0) {
        const li = document.createElement('li');
        li.className = 'sidebar-cat-item' + (activeCategoryId === '__uncategorized__' ? ' active' : '');
        li.dataset.categoryId = '__uncategorized__';
        li.style.setProperty('--cat-color', '#9ca3af');
        li.setAttribute('role', 'button');
        li.setAttribute('tabindex', '0');
        li.setAttribute('aria-pressed', String(activeCategoryId === '__uncategorized__'));

        const dot = document.createElement('span');
        dot.className = 'sidebar-cat-dot';
        dot.style.background = '#9ca3af';

        const name = document.createElement('span');
        name.className = 'sidebar-cat-name';
        name.textContent = 'Uncategorized';

        const badge = document.createElement('span');
        badge.className = 'sidebar-cat-count';
        badge.textContent = String(uncategorizedCount);

        li.append(dot, name, badge);
        list.appendChild(li);
    }

    function renderCatItem(cat, depth) {
        const count = entries.filter((e) => e.categoryId === cat.id).length;
        const isActive = cat.id === activeCategoryId;

        const li = document.createElement('li');
        li.className = 'sidebar-cat-item' + (isActive ? ' active' : '');
        li.dataset.categoryId = cat.id;
        li.style.setProperty('--cat-color', cat.color);
        if (depth > 0) li.style.paddingLeft = `${0.5 + depth * 0.85}rem`;
        li.setAttribute('role', 'button');
        li.setAttribute('tabindex', '0');
        li.setAttribute('aria-pressed', String(isActive));

        const dot = document.createElement('span');
        dot.className = 'sidebar-cat-dot';
        dot.style.background = cat.color;

        const name = document.createElement('span');
        name.className = 'sidebar-cat-name';
        name.textContent = cat.name;

        const badge = document.createElement('span');
        badge.className = 'sidebar-cat-count';
        badge.textContent = String(count);

        li.append(dot, name, badge);
        list.appendChild(li);

        if (isActive) {
            const blockedParentIds = getDescendantIds(cat.id);

            const editRow = document.createElement('li');
            editRow.className = 'sidebar-edit-row';

            const editForm = document.createElement('form');
            editForm.className = 'category-edit-form';
            editForm.noValidate = true;
            editForm.dataset.categoryId = cat.id;

            const editNameInput = document.createElement('input');
            editNameInput.type = 'text';
            editNameInput.className = 'edit-cat-name-input';
            editNameInput.placeholder = 'Category name';
            editNameInput.maxLength = 60;
            editNameInput.required = true;
            editNameInput.value = cat.name;

            const editColorRow = document.createElement('div');
            editColorRow.className = 'color-input-row';

            const editColorPicker = document.createElement('input');
            editColorPicker.type = 'color';
            editColorPicker.className = 'edit-cat-color-picker';
            editColorPicker.value = cat.color;

            const editColorHex = document.createElement('input');
            editColorHex.type = 'text';
            editColorHex.className = 'edit-cat-color-hex';
            editColorHex.maxLength = 7;
            editColorHex.value = cat.color;

            editColorRow.append(editColorPicker, editColorHex);

            const locationSelect = document.createElement('select');
            locationSelect.className = 'category-location-select';
            locationSelect.setAttribute('aria-label', 'Category location');

            const rootOption = document.createElement('option');
            rootOption.value = '';
            rootOption.textContent = 'Root';
            if (!cat.parentId) rootOption.selected = true;
            locationSelect.appendChild(rootOption);

            for (const possibleParent of sorted) {
                if (possibleParent.id === cat.id) continue;
                if (blockedParentIds.has(possibleParent.id)) continue;
                const opt = document.createElement('option');
                opt.value = possibleParent.id;
                opt.textContent = possibleParent.name;
                if (possibleParent.id === cat.parentId) opt.selected = true;
                locationSelect.appendChild(opt);
            }

            const editActions = document.createElement('div');
            editActions.className = 'form-actions';

            const editSubmit = document.createElement('button');
            editSubmit.type = 'submit';
            editSubmit.textContent = 'Save Category';

            const editCancel = document.createElement('button');
            editCancel.type = 'button';
            editCancel.className = 'btn-cancel-category-edit';
            editCancel.textContent = 'Reset';

            const editDelete = document.createElement('button');
            editDelete.type = 'button';
            editDelete.className = 'btn-delete-category';
            editDelete.dataset.categoryId = cat.id;
            editDelete.textContent = 'Delete Category';

            editActions.append(editSubmit, editCancel, editDelete);
            editForm.append(editNameInput, editColorRow, locationSelect, editActions);
            editRow.appendChild(editForm);
            list.appendChild(editRow);

            const subRow = document.createElement('li');
            subRow.className = 'sidebar-subcat-row';

            const addSubBtn = document.createElement('button');
            addSubBtn.type = 'button';
            addSubBtn.className = 'btn-add-subcategory';
            addSubBtn.dataset.parentId = cat.id;
            addSubBtn.textContent = '+ Subcategory';
            subRow.appendChild(addSubBtn);

            const subForm = document.createElement('form');
            subForm.className = 'subcategory-form';
            subForm.hidden = true;
            subForm.noValidate = true;
            subForm.dataset.parentId = cat.id;

            const subNameInput = document.createElement('input');
            subNameInput.type = 'text';
            subNameInput.className = 'subcat-name-input';
            subNameInput.placeholder = 'Subcategory name';
            subNameInput.maxLength = 60;
            subNameInput.required = true;

            const subColorRow = document.createElement('div');
            subColorRow.className = 'color-input-row';

            const subColorPicker = document.createElement('input');
            subColorPicker.type = 'color';
            subColorPicker.className = 'subcat-color-picker';
            subColorPicker.value = cat.color;

            const subColorHex = document.createElement('input');
            subColorHex.type = 'text';
            subColorHex.className = 'subcat-color-hex';
            subColorHex.maxLength = 7;
            subColorHex.value = cat.color;

            subColorRow.append(subColorPicker, subColorHex);

            const subActions = document.createElement('div');
            subActions.className = 'form-actions';

            const subSubmit = document.createElement('button');
            subSubmit.type = 'submit';
            subSubmit.textContent = 'Add';

            const subCancel = document.createElement('button');
            subCancel.type = 'button';
            subCancel.className = 'btn-cancel-subcategory';
            subCancel.textContent = 'Cancel';

            subActions.append(subSubmit, subCancel);
            subForm.append(subNameInput, subColorRow, subActions);
            subRow.appendChild(subForm);
            list.appendChild(subRow);
        }

        const children = sorted.filter((c) => c.parentId === cat.id);
        for (const child of children) {
            renderCatItem(child, depth + 1);
        }
    }

    const topLevel = sorted.filter((c) => !c.parentId || !catIds.has(c.parentId));
    for (const cat of topLevel) {
        renderCatItem(cat, 0);
    }

    if (uncategorizedCount === 0 && categories.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'sidebar-empty';
        empty.textContent = 'No categories yet.';
        list.appendChild(empty);
    }
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Build a single note item DOM element.
 * @param {object} entry
 * @param {object[]} categories
 * @returns {HTMLElement}
 */
function _buildNoteItem(entry, categories, catColor) {
    const item = document.createElement('div');
    item.className = 'note-item';
    item.dataset.entryId = entry.id;
    if (catColor) item.style.setProperty('--note-color', catColor);

    // Title row
    const titleRow = document.createElement('div');
    titleRow.className = 'note-title-row';

    const titleBtn = document.createElement('button');
    titleBtn.type = 'button';
    titleBtn.className = 'note-title-btn';
    titleBtn.textContent = entry.title;
    titleRow.appendChild(titleBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'note-delete-btn';
    deleteBtn.setAttribute('aria-label', 'Delete note');
    deleteBtn.textContent = 'Delete';
    deleteBtn.hidden = true;
    titleRow.appendChild(deleteBtn);

    item.appendChild(titleRow);

    // Expanded content (hidden until title is clicked)
    const expanded = document.createElement('div');
    expanded.className = 'note-expanded';
    expanded.hidden = true;

    const meta = document.createElement('div');
    meta.className = 'note-expanded-meta';

    const currentCategory = categories.find((c) => c.id === entry.categoryId);
    const categoryName = currentCategory ? currentCategory.name : 'Uncategorized';

    const categoryNameLabel = document.createElement('span');
    categoryNameLabel.className = 'note-category-name';
    categoryNameLabel.textContent = `Category: ${categoryName}`;
    meta.appendChild(categoryNameLabel);

    const catSelect = document.createElement('select');
    catSelect.className = 'note-cat-select';
    catSelect.setAttribute('aria-label', 'Category');

    const noneOpt = document.createElement('option');
    noneOpt.value = '';
    noneOpt.textContent = 'Uncategorized';
    if (!entry.categoryId) noneOpt.selected = true;
    catSelect.appendChild(noneOpt);

    for (const cat of categories) {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        if (cat.id === entry.categoryId) opt.selected = true;
        catSelect.appendChild(opt);
    }
    meta.appendChild(catSelect);
    expanded.appendChild(meta);

    const textarea = document.createElement('textarea');
    textarea.className = 'note-text-area';
    textarea.setAttribute('aria-label', 'Note text');
    textarea.value = entry.notes;
    expanded.appendChild(textarea);

    item.appendChild(expanded);
    return item;
}
