# CLAUDE.md

## Tech Stack

- Plain HTML, CSS, and JavaScript only.
- No frameworks or libraries (no React, Vue, Tailwind, jQuery, etc.).
- No build step: files are opened or served exactly as written.

## Project Structure

- `index.html`: portal home page with a card for each tool.
- `css/base.css`: shared styles and the light/dark color variables.
- `js/theme.js`: the light/dark theme toggle used on every page.
- `tools/<tool-name>/`: one folder per tool, holding its own `index.html`, `.css` and `.js`.
  - `tools/circuit/`: breadboard circuit simulator (battery, wire, switch, bulb).
  - `tools/tool-1/`: placeholder page ("coming soon"), no tool logic.
- `CLAUDE.md`: this file (instructions for Claude).

Each page loads `css/base.css` and `js/theme.js`, includes the shared header,
and has a small script in `<head>` that applies the saved theme.
Update this section as files and folders are added.

## Key Requirements

1. Every page must be responsive and work on desktop, tablet and phone.
2. Users can toggle between a light and a dark theme. The default is the light theme.
3. Text must stay easy to read, with good contrast, in both the light and the dark theme.

## Feature Plan

### Portal structure

- **Homepage** (`index.html`): a short intro and a grid of tool cards, one card per tool.
- **Opening a tool:** click its card to open the tool's own page (`tools/<tool-name>/index.html`).
- **Getting back:** every tool page has a "← Back to all tools" link above its title. Every page also has the same header, with the portal name and a "Home" link (both go to the homepage) and the theme toggle.
- **Adding a tool later:**
  1. Create a folder `tools/<tool-name>/` with `index.html`, `<tool-name>.css` and `<tool-name>.js`.
  2. Copy the header and the theme script from an existing tool page.
  3. Add a card for it on the homepage.

### Phases

1. **Portal + first tool (done):**
   - Portal (done): homepage, shared header, light/dark toggle, and a placeholder card "Tool 1 — coming soon" that opens and closes, which proves the navigation pattern.
   - Circuit simulator (done): battery, wire, switch, bulb on a breadboard.
2. **Improve the circuit simulator (proposed):** drag-and-drop placing; save and reload a design.
3. **More tools (proposed):** add Engineering Design tools one at a time, using the steps above.

## Rules for Claude

- Explain technical terms in plain language.
- Ask before making big changes.
- When something is unclear, ask rather than guess.
