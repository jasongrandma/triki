# Personal Wiki Mid-Term Project — Plan of Action

## Project Overview
A static frontend **Personal Wiki** built with HTML, CSS, and JavaScript.

The app lets users create and organize notes using nested, color-coded categories in a vertical tree hierarchy. Data is stored in the browser using `localStorage` (JSON object structure), with no backend required.

## Project Type and Scope
- **Website Type:** Content management / personal knowledge base (Personal Wiki)
- **Approach:** Static HTML/CSS/JS site
- **Complexity Target:** Frontend-only, browser persistence with `localStorage`
- **Primary Goal:** Usable, visually structured note system with customizable themes

## Core Features and Deliverables

### 1) CRUD Notes + Nested Category Tree (Color-Coded)
**Deliverables (initial):**
- Create, read, update, delete note entries.
- Tree view for nested categories (vertical hierarchy).
- Category object includes: name, color, children, entries.
- Entry object includes: title, notes.
- Add/edit/delete/rearrange categories (move up/down and re-parent).
- Select category to view tagged entries.
- Entry form includes title, notes, and category selection from the tree.

### 2) Search + Filters
**Deliverables (initial):**
- Global search bar in top navigation.
- Search by note title and note text.
- Filter by category (including optional child categories).
- Results update without page reload.

### 3) Collapsible Sidebar Navigation
**Deliverables (initial):**
- Sidebar toggle (open/close).
- Table of contents for categories.
- Quick links to major app sections (Home, New Entry, Manage Categories, Theme Settings).

### 4) Data Import/Export (Backup + Restore)
**Deliverables (initial):**
- Export wiki data JSON file from `localStorage`.
- Import JSON backup to restore data.
- Basic validation before import (required keys and structure).
- Confirmation dialog before replacing existing data.

### 5) Custom Color Themes (Saved Presets)
**Deliverables (initial):**
- Theme editor for primary, secondary, tertiary, and accent colors.
- Apply theme instantly using CSS variables.
- Save multiple custom theme presets in `localStorage`.
- Rename, apply, and delete saved themes.

## Suggested Data Model (High-Level)
```json
{
  "categories": [
    {
      "id": "cat-1",
      "name": "Programming",
      "color": "#4f46e5",
      "children": [],
      "entries": ["entry-1"]
    }
  ],
  "entries": [
    {
      "id": "entry-1",
      "title": "Array Methods",
      "notes": "map, filter, reduce...",
      "categoryId": "cat-1",
      "updatedAt": "2026-03-09T12:00:00Z"
    }
  ],
  "themes": [
    {
      "id": "theme-1",
      "name": "Ocean",
      "primary": "#0ea5e9",
      "secondary": "#1e293b",
      "tertiary": "#334155",
      "accent": "#22d3ee"
    }
  ]
}
```

## Tech Stack
- **Structure:** HTML5
- **Styling:** CSS3 (with CSS custom properties / variables)
- **Behavior:** Vanilla JavaScript (ES6+)
- **Persistence:** `localStorage` (JSON serialization)
- **Optional later upgrade:** IndexedDB if data size/performance outgrows `localStorage`

## Milestone Plan (Simple)
### Milestone 1 — Foundation
- Base layout: navbar, sidebar, main content, category tree panel.
- Local storage utility module (load/save/default data).

### Milestone 2 — Categories + Entries
- Category tree rendering and category CRUD/rearrange.
- Entry CRUD with category assignment.

### Milestone 3 — Search + Navigation
- Global search and category filters.
- Sidebar table of contents and navigation polish.

### Milestone 4 — Themes + Data Portability
- Theme editor and preset management.
- Import/export backup and restore flow.

### Milestone 5 — QA + Submission Prep
- Test core user flows and edge cases.
- Clean UI text and accessibility pass.
- Final README and demo checklist.

## Definition of Done (Mid-Term)
- All planned core features are functional with browser persistence.
- No backend dependency.
- Data survives browser refresh/reopen.
- Interface supports basic accessibility (labels, keyboard navigation, contrast checks).
- README documents setup, usage, and feature list.
