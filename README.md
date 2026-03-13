# Personal Custom Wiki

## Project Overview
Triki is a static frontend Personal Wiki built with HTML, CSS, and JavaScript.

The app lets users create and organize notes using nested, color-coded categories in a vertical tree hierarchy. Data is stored in the browser using `localStorage`, with no backend required.

## Project Description
I built Triki as a personal custom wiki that lets me organize notes inside a visual category structure instead of a plain list. My goal was to make something that felt more interactive and personal than a basic notes app, while still staying fully frontend and easy to run. The project focuses on note organization, theme customization, and browser-based persistence so everything works without a server.

## Technologies Used
- HTML5 for structure and layout
- CSS3 for styling, responsive layout, and theme variables
- Vanilla JavaScript for app logic and DOM interactions
- `localStorage` for client-side persistence
- JSON for the stored data structure and import/export flow

## Setup Instructions
Open https://triki-mid.netlify.app/ in a browser. Create categories from the sidebar, then create notes and assign them to those categories. Everything saves in the browser automatically.

## Known Bugs and Limitations
- Because the app uses `localStorage`, stored data is limited by browser storage size and can be lost if browser data is cleared.
- Since this is a static frontend project, data does not sync across devices or browsers.
- Deeply nested categories can become harder to manage visually in the sidebar.
- Very large note collections may make rendering and filtering feel slower because everything is handled client-side in JavaScript.
- Imported JSON still depends on the expected schema, so malformed or heavily edited files can create edge cases.

## What I Learned
I learned a lot about structuring a frontend app without relying on frameworks. Separating storage, state, rendering, and event wiring made the project much easier to reason about as it grew. I also got more experience thinking about how UI design, data structure, and browser persistence all affect each other in a static app. Working with AI was helpful, but it also showed me that AI is very good at confidently coming up with whatever it wants, which can be a problem when my vision is more specific than its assumptions. Sometimes that meant I had to correct direction and keep refining outputs until they actually matched what I wanted. In more creative areas, though, it was really useful, especially for things like color palette ideas and exploring design directions quickly.

## Consolidated Planning Details

### Project Type and Scope
- Website type: content management / personal knowledge base
- Approach: static HTML, CSS, and JavaScript site
- Complexity target: frontend-only with browser persistence
- Primary goal: a usable, visually structured note system with customizable themes

### Core Planned Features
- CRUD note management with category assignment
- Nested, color-coded category tree
- Search by note title and note text
- Category filtering without page reload
- Collapsible sidebar navigation
- Theme editor and saved theme management
- Import and export of stored data
- Reset and persistence using browser storage

### Architecture Guardrail
To keep complexity manageable, the logic was split into modules:
- `storage.js` for localStorage load, save, defaults, and validation
- `state.js` for in-memory state and mutations
- `render.js` for UI rendering
- `app.js` for startup, event binding, and orchestration

### Canonical Data Shape
```json
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
```

### Planning Notes
- Use a namespaced storage key such as `triki_data`
- Use `crypto.randomUUID()` for IDs
- Add `createdAt` to entries for ordering and debugging
- Guard destructive category deletion when notes or child categories still exist
- Debounce note autosave and search input for smoother UI behavior
- Validate imported JSON before replacing current app data
- Pair theme hex fields with color pickers and keep them synced
- Persist the active theme at the root of the schema

### Recommended Build Order
1. Storage module and schema defaults
2. Category sidebar and category creation
3. Note creation and rendering
4. Full note CRUD and recategorization
5. Search and filtering
6. Import and export
7. Theme editor and theme persistence

### Definition of Done
- Core features work entirely in the browser
- No backend dependency is required
- Data survives refresh and browser reopen
- The interface remains usable with clear labels and basic keyboard support
- The README documents the project, structure, and limitations

### Current File Structure
- `index.html`
- `styles.css`
- `scripts/storage.js`
- `scripts/state.js`
- `scripts/render.js`
- `scripts/app.js`
