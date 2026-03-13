/**
 * app.js
 * Entry point. Wires up initialization and top-level event listeners.
 * Feature-specific event handling will be added here as each milestone is built.
 */

import {
    init,
    addCategory,
    addEntry,
    updateEntry,
    deleteEntry,
    getCategories,
    updateCategory,
    deleteCategory,
    getSnapshot,
    replaceAll,
    getThemes,
    getActiveThemeId,
    saveTheme,
    setActiveTheme,
    deleteTheme,
} from './state.js';
import { applyActiveTheme, renderTree, renderSidebar } from './render.js';
import { clearData, validateImport } from './storage.js';

// ─── Transient UI state ─────────────────────────────────────────────────────────────────
let _filterCategoryId = null;
let _searchQuery = '';
let _searchScope = 'both';

// ─── Helpers ───────────────────────────────────────────────────────────────────────────
function rerender() {
    renderTree({
        filterCategoryId: _filterCategoryId,
        searchQuery: _searchQuery,
        searchScope: _searchScope,
    });
    renderSidebar({ activeCategoryId: _filterCategoryId });
}

function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

function autoResizeTextarea(ta) {
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
}

function randomHexColor() {
    const n = Math.floor(Math.random() * 0xffffff);
    return `#${n.toString(16).padStart(6, '0')}`;
}

function isHexColor(value) {
    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}

function expandHex3(value) {
    if (!/^#[0-9a-fA-F]{3}$/.test(value)) return value;
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
}

function normalizeHex(value, fallback) {
    const trimmed = (value || '').trim();
    if (!isHexColor(trimmed)) return fallback;
    return expandHex3(trimmed).toLowerCase();
}

function populateCategorySelect(selectEl, selectedId = '') {
    const categories = getCategories();
    selectEl.innerHTML = '<option value="">Uncategorized</option>';
    for (const cat of categories) {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        if (cat.id === selectedId) opt.selected = true;
        selectEl.appendChild(opt);
    }
}

function isDescendantCategory(candidateParentId, categoryId, categories) {
    if (!candidateParentId || candidateParentId === categoryId) return false;
    const byId = new Map(categories.map((c) => [c.id, c]));
    let current = byId.get(candidateParentId);
    while (current) {
        if (current.parentId === categoryId) return true;
        current = current.parentId ? byId.get(current.parentId) : null;
    }
    return false;
}

// ─── Init ────────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    init();
    applyActiveTheme();
    rerender();

    const searchInput = document.getElementById('search-input');
    const searchScope = document.getElementById('search-scope');
    const btnClearSearch = document.getElementById('btn-clear-search');
    const btnImport = document.getElementById('btn-import');
    const btnExport = document.getElementById('btn-export');
    const importFileInput = document.getElementById('import-file-input');
    const navThemes = document.getElementById('nav-themes');
    const pageLayout = document.getElementById('page-layout');
    const sidebarToggle = document.getElementById('sidebar-toggle');

    const themeSection = document.getElementById('theme-section');
    const themeEditorForm = document.getElementById('theme-editor-form');
    const themeEditIdInput = document.getElementById('theme-edit-id');
    const themeNameInput = document.getElementById('theme-name-input');
    const btnThemeReset = document.getElementById('btn-theme-reset');
    const savedThemesList = document.getElementById('saved-themes-list');

    const themePrimaryPicker = document.getElementById('theme-primary-picker');
    const themePrimaryHex = document.getElementById('theme-primary-hex');
    const themeSecondaryPicker = document.getElementById('theme-secondary-picker');
    const themeSecondaryHex = document.getElementById('theme-secondary-hex');
    const themeTertiaryPicker = document.getElementById('theme-tertiary-picker');
    const themeTertiaryHex = document.getElementById('theme-tertiary-hex');
    const themeAccentPicker = document.getElementById('theme-accent-picker');
    const themeAccentHex = document.getElementById('theme-accent-hex');

    function getActiveThemeObject() {
        const themes = getThemes();
        const activeId = getActiveThemeId();
        return themes.find((t) => t.id === activeId) ?? themes[0] ?? null;
    }

    function fillThemeForm(theme, editId = '') {
        if (!theme || !themeNameInput) return;
        themeEditIdInput.value = editId;
        themeNameInput.value = theme.name || '';

        const primary = normalizeHex(theme.primary, '#f3f4f6');
        const secondary = normalizeHex(theme.secondary, '#e5e7eb');
        const tertiary = normalizeHex(theme.tertiary, '#d1d5db');
        const accent = normalizeHex(theme.accent, '#6b7280');

        themePrimaryPicker.value = primary;
        themePrimaryHex.value = primary;
        themeSecondaryPicker.value = secondary;
        themeSecondaryHex.value = secondary;
        themeTertiaryPicker.value = tertiary;
        themeTertiaryHex.value = tertiary;
        themeAccentPicker.value = accent;
        themeAccentHex.value = accent;
    }

    function applyThemePreviewFromForm() {
        const root = document.documentElement;
        root.style.setProperty('--color-primary', normalizeHex(themePrimaryHex.value, themePrimaryPicker.value));
        root.style.setProperty('--color-secondary', normalizeHex(themeSecondaryHex.value, themeSecondaryPicker.value));
        root.style.setProperty('--color-tertiary', normalizeHex(themeTertiaryHex.value, themeTertiaryPicker.value));
        root.style.setProperty('--color-accent', normalizeHex(themeAccentHex.value, themeAccentPicker.value));
    }

    function wireColorPair(picker, hexInput) {
        picker.addEventListener('input', () => {
            hexInput.value = picker.value;
            applyThemePreviewFromForm();
        });

        hexInput.addEventListener('input', () => {
            const v = hexInput.value.trim();
            if (isHexColor(v)) {
                picker.value = expandHex3(v);
                applyThemePreviewFromForm();
            }
        });
    }

    function renderSavedThemes() {
        if (!savedThemesList) return;
        savedThemesList.textContent = '';

        const themes = getThemes();
        const activeId = getActiveThemeId();

        if (themes.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'saved-themes-empty';
            empty.textContent = 'No themes saved yet.';
            savedThemesList.appendChild(empty);
            return;
        }

        for (const theme of themes) {
            const card = document.createElement('article');
            card.className = 'theme-card' + (theme.id === activeId ? ' active' : '');
            card.dataset.themeId = theme.id;

            const head = document.createElement('div');
            head.className = 'theme-card-head';

            const name = document.createElement('h4');
            name.className = 'theme-card-name';
            name.textContent = theme.name;

            const badge = document.createElement('span');
            badge.className = 'theme-card-badge';
            badge.textContent = theme.id === activeId ? 'Active' : 'Saved';

            head.append(name, badge);

            const swatches = document.createElement('div');
            swatches.className = 'theme-card-swatches';
            for (const key of ['primary', 'secondary', 'tertiary', 'accent']) {
                const swatch = document.createElement('span');
                swatch.className = 'theme-swatch';
                swatch.title = `${key}: ${theme[key]}`;
                swatch.style.background = theme[key];
                swatches.appendChild(swatch);
            }

            const actions = document.createElement('div');
            actions.className = 'theme-card-actions';

            const btnApply = document.createElement('button');
            btnApply.type = 'button';
            btnApply.className = 'btn-theme-apply';
            btnApply.dataset.themeId = theme.id;
            btnApply.textContent = 'Apply';

            const btnEdit = document.createElement('button');
            btnEdit.type = 'button';
            btnEdit.className = 'btn-theme-edit';
            btnEdit.dataset.themeId = theme.id;
            btnEdit.textContent = 'Edit';

            const btnDelete = document.createElement('button');
            btnDelete.type = 'button';
            btnDelete.className = 'btn-theme-delete';
            btnDelete.dataset.themeId = theme.id;
            btnDelete.textContent = 'Delete Theme';

            actions.append(btnApply, btnEdit, btnDelete);
            card.append(head, swatches, actions);
            savedThemesList.appendChild(card);
        }
    }

    function resetThemeFormToActive() {
        const activeTheme = getActiveThemeObject();
        if (!activeTheme) return;
        fillThemeForm(activeTheme, '');
        applyActiveTheme();
    }

    function setSidebarExpanded(isExpanded) {
        if (!pageLayout || !sidebarToggle) return;
        pageLayout.classList.toggle('sidebar-collapsed', !isExpanded);
        sidebarToggle.setAttribute('aria-expanded', String(isExpanded));
        sidebarToggle.setAttribute('aria-label', isExpanded ? 'Collapse categories sidebar' : 'Expand categories sidebar');
        sidebarToggle.title = isExpanded ? 'Collapse sidebar' : 'Expand sidebar';
    }

    setSidebarExpanded(true);

    sidebarToggle?.addEventListener('click', () => {
        const isExpanded = !pageLayout.classList.contains('sidebar-collapsed');
        setSidebarExpanded(!isExpanded);
    });

    const navReset = document.getElementById('nav-reset');
    navReset?.addEventListener('click', () => {
        const ok = confirm('Reset all Triki data? This deletes all notes, categories, and themes.');
        if (!ok) return;

        clearData();
        _filterCategoryId = null;
        _searchQuery = '';
        _searchScope = 'both';
        if (searchInput) searchInput.value = '';
        if (searchScope) searchScope.value = 'both';
        init();
        applyActiveTheme();
        rerender();
        resetThemeFormToActive();
        renderSavedThemes();
    });

    function setThemePanelOpen(isOpen) {
        if (!themeSection || !navThemes) return;
        themeSection.hidden = !isOpen;
        navThemes.setAttribute('aria-expanded', String(isOpen));
        navThemes.classList.toggle('active', isOpen);
    }

    navThemes?.addEventListener('click', (e) => {
        e.preventDefault();
        if (!themeSection) return;
        const willOpen = themeSection.hidden;
        setThemePanelOpen(willOpen);
    });

    document.addEventListener('click', (e) => {
        if (!themeSection || themeSection.hidden) return;
        const target = e.target;
        if (!(target instanceof Node)) return;
        const clickedInsidePanel = themeSection.contains(target);
        const clickedThemeToggle = navThemes?.contains(target);
        if (clickedInsidePanel || clickedThemeToggle) return;
        setThemePanelOpen(false);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        setThemePanelOpen(false);
    });

    if (themeEditorForm) {
        wireColorPair(themePrimaryPicker, themePrimaryHex);
        wireColorPair(themeSecondaryPicker, themeSecondaryHex);
        wireColorPair(themeTertiaryPicker, themeTertiaryHex);
        wireColorPair(themeAccentPicker, themeAccentHex);

        themeEditorForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = themeNameInput.value.trim();
            if (!name) return;

            const saved = saveTheme({
                id: themeEditIdInput.value || undefined,
                name,
                primary: normalizeHex(themePrimaryHex.value, themePrimaryPicker.value),
                secondary: normalizeHex(themeSecondaryHex.value, themeSecondaryPicker.value),
                tertiary: normalizeHex(themeTertiaryHex.value, themeTertiaryPicker.value),
                accent: normalizeHex(themeAccentHex.value, themeAccentPicker.value),
            });

            setActiveTheme(saved.id);
            applyActiveTheme();
            fillThemeForm(saved, '');
            renderSavedThemes();
        });

        btnThemeReset?.addEventListener('click', () => {
            resetThemeFormToActive();
        });

        savedThemesList?.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            const themeId = btn.dataset.themeId;
            if (!themeId) return;

            if (btn.classList.contains('btn-theme-apply')) {
                setActiveTheme(themeId);
                applyActiveTheme();
                const theme = getThemes().find((t) => t.id === themeId);
                if (theme) fillThemeForm(theme, '');
                renderSavedThemes();
                return;
            }

            if (btn.classList.contains('btn-theme-edit')) {
                const theme = getThemes().find((t) => t.id === themeId);
                if (!theme) return;
                fillThemeForm(theme, theme.id);
                applyThemePreviewFromForm();
                setThemePanelOpen(true);
                return;
            }

            if (btn.classList.contains('btn-theme-delete')) {
                if (!confirm('Delete this saved theme?')) return;
                const result = deleteTheme(themeId);
                if (!result.success) {
                    alert(result.error || 'Could not delete theme.');
                    return;
                }
                renderSavedThemes();
                resetThemeFormToActive();
            }
        });

        themeEditorForm.addEventListener('input', (e) => {
            if (!(e.target instanceof HTMLInputElement)) return;
            if (e.target.id === 'theme-name-input') return;
            applyThemePreviewFromForm();
        });

        resetThemeFormToActive();
        renderSavedThemes();
    }

    const applySearch = debounce(() => {
        _searchQuery = searchInput?.value.trim() ?? '';
        rerender();
    }, 180);

    searchInput?.addEventListener('input', applySearch);
    searchScope?.addEventListener('change', () => {
        _searchScope = searchScope.value || 'both';
        rerender();
    });
    btnClearSearch?.addEventListener('click', () => {
        _searchQuery = '';
        _searchScope = 'both';
        if (searchInput) searchInput.value = '';
        if (searchScope) searchScope.value = 'both';
        rerender();
    });

    // ── Import / Export ──────────────────────────────────────────────────────
    btnExport?.addEventListener('click', () => {
        const snapshot = getSnapshot();
        const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const filename = `triki-backup-${yyyy}-${mm}-${dd}.json`;

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    });

    btnImport?.addEventListener('click', () => {
        importFileInput?.click();
    });

    importFileInput?.addEventListener('change', async () => {
        const file = importFileInput.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const raw = JSON.parse(text);
            const checked = validateImport(raw);
            if (!checked.valid) {
                alert(`Import failed: ${checked.error || 'Invalid JSON schema.'}`);
                importFileInput.value = '';
                return;
            }

            const ok = confirm('Import will replace all current data. Continue?');
            if (!ok) {
                importFileInput.value = '';
                return;
            }

            replaceAll(checked.data);
            _filterCategoryId = null;
            _searchQuery = '';
            _searchScope = 'both';
            if (searchInput) searchInput.value = '';
            if (searchScope) searchScope.value = 'both';
            applyActiveTheme();
            rerender();
            resetThemeFormToActive();
            renderSavedThemes();
        } catch {
            alert('Import failed: file is not valid JSON.');
        } finally {
            importFileInput.value = '';
        }
    });

    // ── Add-note form ─────────────────────────────────────────────────────
    const btnAddNote = document.getElementById('btn-add-note');
    const addNoteForm = document.getElementById('add-note-form');

    btnAddNote.addEventListener('click', () => {
        const willShow = addNoteForm.hidden;
        addNoteForm.hidden = !willShow;
        btnAddNote.classList.toggle('active', willShow);
        if (willShow) {
            populateCategorySelect(document.getElementById('note-category-select'));
            document.getElementById('note-title-input').focus();
        }
    });

    addNoteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('note-title-input').value.trim();
        if (!title) return;
        addEntry({
            title,
            notes: document.getElementById('note-text-input').value,
            categoryId: document.getElementById('note-category-select').value || null,
        });
        addNoteForm.reset();
        addNoteForm.hidden = true;
        btnAddNote.classList.remove('active');
        rerender();
    });

    document.getElementById('btn-cancel-note').addEventListener('click', () => {
        addNoteForm.reset();
        addNoteForm.hidden = true;
        btnAddNote.classList.remove('active');
    });

    // ── New-category form ───────────────────────────────────────────────────
    const btnNewCat = document.getElementById('btn-new-category');
    const newCatForm = document.getElementById('new-category-form');
    const catColorPicker = document.getElementById('cat-color-picker');
    const catColorHex = document.getElementById('cat-color-hex');

    btnNewCat.addEventListener('click', () => {
        newCatForm.hidden = !newCatForm.hidden;
        if (!newCatForm.hidden) {
            const randomColor = randomHexColor();
            catColorPicker.value = randomColor;
            catColorHex.value = randomColor;
            document.getElementById('cat-name-input').focus();
        }
    });

    catColorPicker.addEventListener('input', () => {
        catColorHex.value = catColorPicker.value;
    });

    catColorHex.addEventListener('input', () => {
        const v = catColorHex.value.trim();
        if (/^#[0-9a-fA-F]{6}$/.test(v)) catColorPicker.value = v;
    });

    newCatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('cat-name-input').value.trim();
        if (!name) return;
        const hexVal = catColorHex.value.trim();
        const color = /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(hexVal) ? hexVal : catColorPicker.value;
        addCategory({ name, color });
        newCatForm.reset();
        const randomColor = randomHexColor();
        catColorPicker.value = randomColor;
        catColorHex.value = randomColor;
        newCatForm.hidden = true;
        rerender();
    });

    document.getElementById('btn-cancel-category').addEventListener('click', () => {
        newCatForm.reset();
        const randomColor = randomHexColor();
        catColorPicker.value = randomColor;
        catColorHex.value = randomColor;
        newCatForm.hidden = true;
    });

    // ── Sidebar category filter ──────────────────────────────────────────────
    const sidebarList = document.getElementById('sidebar-category-list');
    sidebarList.addEventListener('click', (e) => {
        const item = e.target.closest('.sidebar-cat-item');
        if (!item) return;
        const catId = item.dataset.categoryId;
        _filterCategoryId = _filterCategoryId === catId ? null : catId;
        rerender();
    });

    sidebarList.addEventListener('click', (e) => {
        if (!e.target.classList.contains('btn-delete-category')) return;
        const categoryId = e.target.dataset.categoryId;
        if (!categoryId) return;
        if (!confirm('Delete this category? This only works if it has no subcategories and no notes.')) return;

        const result = deleteCategory(categoryId);
        if (!result.success) {
            alert(result.error || 'Could not delete category.');
            return;
        }

        if (_filterCategoryId === categoryId) {
            _filterCategoryId = null;
        }
        rerender();
    });
    sidebarList.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const item = e.target.closest('.sidebar-cat-item');
        if (!item) return;
        e.preventDefault();
        const catId = item.dataset.categoryId;
        _filterCategoryId = _filterCategoryId === catId ? null : catId;
        rerender();
    });

    // ── Subcategory inline form (delegated) ────────────────────────────────────
    sidebarList.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-add-subcategory')) {
            const subForm = e.target.closest('.sidebar-subcat-row').querySelector('.subcategory-form');
            subForm.hidden = !subForm.hidden;
            if (!subForm.hidden) subForm.querySelector('.subcat-name-input').focus();
            return;
        }
        if (e.target.classList.contains('btn-cancel-subcategory')) {
            e.target.closest('.subcategory-form').hidden = true;
        }
    });

    sidebarList.addEventListener('submit', (e) => {
        if (e.target.classList.contains('category-edit-form')) {
            e.preventDefault();
            const form = e.target;
            const categoryId = form.dataset.categoryId;
            const name = form.querySelector('.edit-cat-name-input').value.trim();
            if (!name) return;

            const hexInput = form.querySelector('.edit-cat-color-hex').value.trim();
            const picker = form.querySelector('.edit-cat-color-picker').value;
            const color = /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(hexInput) ? hexInput : picker;

            const selectedParentId = form.querySelector('.category-location-select').value || null;
            const categories = getCategories();
            if (isDescendantCategory(selectedParentId, categoryId, categories)) {
                alert('Invalid location: a category cannot be moved inside its own descendant.');
                return;
            }

            updateCategory(categoryId, {
                name,
                color,
                parentId: selectedParentId,
            });
            rerender();
            return;
        }

        if (!e.target.classList.contains('subcategory-form')) return;
        e.preventDefault();
        const form = e.target;
        const name = form.querySelector('.subcat-name-input').value.trim();
        if (!name) return;
        const hexInput = form.querySelector('.subcat-color-hex').value.trim();
        const picker = form.querySelector('.subcat-color-picker').value;
        const color = /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(hexInput) ? hexInput : picker;
        addCategory({ name, color, parentId: form.dataset.parentId });
        rerender();
    });

    sidebarList.addEventListener('input', (e) => {
        if (e.target.classList.contains('edit-cat-color-picker')) {
            const hex = e.target.closest('.color-input-row').querySelector('.edit-cat-color-hex');
            if (hex) hex.value = e.target.value;
        }
        if (e.target.classList.contains('edit-cat-color-hex')) {
            const v = e.target.value.trim();
            if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                const picker = e.target.closest('.color-input-row').querySelector('.edit-cat-color-picker');
                if (picker) picker.value = v;
            }
        }

        if (e.target.classList.contains('subcat-color-picker')) {
            const hex = e.target.closest('.color-input-row').querySelector('.subcat-color-hex');
            if (hex) hex.value = e.target.value;
        }
        if (e.target.classList.contains('subcat-color-hex')) {
            const v = e.target.value.trim();
            if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                const picker = e.target.closest('.color-input-row').querySelector('.subcat-color-picker');
                if (picker) picker.value = v;
            }
        }
    });

    sidebarList.addEventListener('click', (e) => {
        if (!e.target.classList.contains('btn-cancel-category-edit')) return;
        rerender();
    });

    // ── Tree delegated events ───────────────────────────────────────────────────
    const mainTree = document.getElementById('main-tree');

    mainTree.addEventListener('click', (e) => {
        // Title: toggle expand/collapse
        if (e.target.classList.contains('note-title-btn')) {
            const item = e.target.closest('.note-item');
            const expanded = item.querySelector('.note-expanded');
            const deleteBtn = item.querySelector('.note-delete-btn');
            const isExpanded = !expanded.hidden;
            expanded.hidden = isExpanded;
            deleteBtn.hidden = isExpanded;
            if (!expanded.hidden) {
                autoResizeTextarea(item.querySelector('.note-text-area'));
            }
            return;
        }
        // Delete button
        if (e.target.classList.contains('note-delete-btn')) {
            const item = e.target.closest('.note-item');
            if (confirm('Delete this note? This cannot be undone.')) {
                deleteEntry(item.dataset.entryId);
                rerender();
            }
        }
    });

    // Category dropdown: re-categorize and re-render
    mainTree.addEventListener('change', (e) => {
        if (!e.target.classList.contains('note-cat-select')) return;
        const item = e.target.closest('.note-item');
        updateEntry(item.dataset.entryId, { categoryId: e.target.value || null });
        rerender();
    });

    // Textarea: auto-resize + debounced save
    const saveNoteText = debounce((entryId, notes) => {
        updateEntry(entryId, { notes });
    }, 800);

    mainTree.addEventListener('input', (e) => {
        if (!e.target.classList.contains('note-text-area')) return;
        autoResizeTextarea(e.target);
        const item = e.target.closest('.note-item');
        saveNoteText(item.dataset.entryId, e.target.value);
    });

    console.log('[triki] App initialized.');
});
