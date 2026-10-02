# VIP Studios CMS Website v4

This version is built for **Pages CMS + GitHub + Netlify**.

## What you can edit without coding

- Site name and logo
- Discord invite and Roblox group link
- Theme accent colors
- Homepage text and buttons
- Section visibility
- Updates
- Projects and project images
- Under-construction mode
- Chain of command / ranks
- Staff members
- Staff photos / Roblox avatars
- Staff portfolio descriptions
- Staff application instructions
- Community section
- Footer text

## How it works

1. **GitHub** stores the website and all content.
2. **Pages CMS** gives you a visual editor for the files defined in `.pages.yml`.
3. **Netlify** publishes the GitHub repository and automatically republishes after each saved change.

## Local preview

Use VS Code + Live Server. Do not double-click `index.html`, because browsers block local `fetch()` requests to the JSON content files.

## Important files

- `.pages.yml` - tells Pages CMS what can be edited
- `content/site.json` - global site content/settings
- `content/ranks.json` - chain of command
- `content/staff.json` - staff portfolios
- `content/projects.json` - projects
- `content/updates.json` - updates
- `assets/media/` - CMS-uploaded images
- `index.html`, `styles.css`, `app.js` - website layout/design
