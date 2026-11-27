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
- `CLAUDE.md`: this file (instructions for Claude).

Each page loads `css/base.css` and `js/theme.js`, includes the shared header,
and has a small script in `<head>` that applies the saved theme.
Update this section as files and folders are added.

## Key Requirements

1. Every page must be responsive and work on desktop, tablet and phone.
2. Users can toggle between a light and a dark theme. The default is the light theme.
3. Text must stay easy to read, with good contrast, in both the light and the dark theme.

## Rules for Claude

- Explain technical terms in plain language.
- Ask before making big changes.
- When something is unclear, ask rather than guess.
